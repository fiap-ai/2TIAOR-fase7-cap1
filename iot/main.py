"""CardioIA IoT — MicroPython Health Monitoring for ESP32 (Wokwi).

Ported from Phase 3 sketch.ino (C++/Arduino) to MicroPython.
Reads DHT22 (temperature) + potentiometer (simulated heart rate),
displays on SSD1306 OLED, controls alert LEDs, and sends data
to the backend via HTTP POST.

Author: Gabriel Mule (RM 560586)
"""

import dht
import json
import machine
import network
import time

try:
    import urequests as requests
except ImportError:
    import requests

try:
    import ssd1306
except ImportError:
    # Inline minimal SSD1306 I2C driver if module not available
    # (Wokwi VS Code extension may not load separate .py files)
    try:
        import framebuf

        class _SSD1306(framebuf.FrameBuffer):
            def __init__(self, width, height, external_vcc):
                self.width = width
                self.height = height
                self.external_vcc = external_vcc
                self.pages = self.height // 8
                self.buffer = bytearray(self.pages * self.width)
                super().__init__(self.buffer, self.width, self.height, framebuf.MONO_VLSB)
                self._init_display()

            def _init_display(self):
                for cmd in (
                    0xAE, 0x20, 0x00, 0x40, 0xA1, 0xA8, self.height - 1,
                    0xC8, 0xD3, 0x00, 0xDA,
                    0x02 if self.width > 2 * self.height else 0x12,
                    0xD5, 0x80, 0xD9,
                    0x22 if self.external_vcc else 0xF1,
                    0xDB, 0x30, 0x81, 0xFF, 0xA4, 0xA6, 0xAD, 0x30,
                    0x8D, 0x10 if self.external_vcc else 0x14, 0xAF,
                ):
                    self.write_cmd(cmd)
                self.fill(0)
                self.show()

            def show(self):
                self.write_cmd(0x21)  # SET_COL_ADDR
                self.write_cmd(0)
                self.write_cmd(self.width - 1)
                self.write_cmd(0x22)  # SET_PAGE_ADDR
                self.write_cmd(0)
                self.write_cmd(self.pages - 1)
                self.write_data(self.buffer)

        class SSD1306_I2C(_SSD1306):
            def __init__(self, width, height, i2c, addr=0x3C, external_vcc=False):
                self.i2c = i2c
                self.addr = addr
                self.temp = bytearray(2)
                self.write_list = [b"\x40", None]
                super().__init__(width, height, external_vcc)

            def write_cmd(self, cmd):
                self.temp[0] = 0x80
                self.temp[1] = cmd
                self.i2c.writeto(self.addr, self.temp)

            def write_data(self, buf):
                self.i2c.writeto(self.addr, b"\x40" + buf)

        # Create a mock module namespace
        class _Module:
            pass
        ssd1306 = _Module()
        ssd1306.SSD1306_I2C = SSD1306_I2C
        print("[OLED] Using inline SSD1306 driver")
    except Exception as e:
        print("[OLED] Cannot create inline driver: %s" % e)
        ssd1306 = None

# ============================================================================
# CONFIGURATION (ported from Phase 3 sketch.ino)
# ============================================================================

# WiFi
WIFI_SSID = "Wokwi-GUEST"
WIFI_PASSWORD = ""

# Backend API
BACKEND_URL = "http://localhost:8000/api/sensors"
DEVICE_ID = "esp32-wokwi-01"

# Sensor Pins (same GPIOs as Phase 3)
DHT_PIN = 22
HR_ANALOG_PIN = 34

# LED Pins (same GPIOs as Phase 3)
LED_GREEN_PIN = 25   # Normal / WiFi connected
LED_YELLOW_PIN = 26  # Warning
LED_RED_PIN = 27     # Critical / Offline

# OLED I2C (replaces Phase 3 LCD I2C — same SDA/SCL pins)
OLED_SDA_PIN = 21
OLED_SCL_PIN = 23
OLED_WIDTH = 128
OLED_HEIGHT = 64

# Reading interval (ms)
SENSOR_INTERVAL_MS = 3000

# Heart Rate simulation range (from Phase 3 potentiometer mapping)
HR_MIN = 40
HR_MAX = 180
ADC_MAX = 4095

# Health Thresholds (from Phase 3)
TEMP_NORMAL_MAX = 37.0
TEMP_WARNING_MAX = 38.0
HR_NORMAL_MIN = 60
HR_NORMAL_MAX = 100
HR_WARNING_MAX = 120

# ============================================================================
# HARDWARE SETUP
# ============================================================================

# DHT22 sensor
dht_sensor = dht.DHT22(machine.Pin(DHT_PIN))

# Heart rate potentiometer (ADC)
hr_adc = machine.ADC(machine.Pin(HR_ANALOG_PIN))
hr_adc.atten(machine.ADC.ATTN_11DB)  # Full range: 0-3.3V

# LEDs
led_green = machine.Pin(LED_GREEN_PIN, machine.Pin.OUT)
led_yellow = machine.Pin(LED_YELLOW_PIN, machine.Pin.OUT)
led_red = machine.Pin(LED_RED_PIN, machine.Pin.OUT)

# OLED display
oled = None
i2c = None

def init_oled():
    """Initialize OLED display with I2C. Tries SoftI2C then I2C."""
    global oled, i2c

    if ssd1306 is None:
        print("[OLED] ssd1306 module not available")
        return

    # Try SoftI2C first (works on most MicroPython versions)
    for label, bus in [
        ("SoftI2C", lambda: machine.SoftI2C(sda=machine.Pin(OLED_SDA_PIN), scl=machine.Pin(OLED_SCL_PIN), freq=400000)),
        ("I2C(1)",  lambda: machine.I2C(1, sda=machine.Pin(OLED_SDA_PIN), scl=machine.Pin(OLED_SCL_PIN), freq=400000)),
    ]:
        try:
            i2c = bus()
            devices = i2c.scan()
            print("[OLED] %s scan found: %s" % (label, [hex(d) for d in devices]))
            if devices:
                oled = ssd1306.SSD1306_I2C(OLED_WIDTH, OLED_HEIGHT, i2c)
                print("[OLED] Display initialized via %s" % label)
                return
        except Exception as e:
            print("[OLED] %s failed: %s" % (label, e))

    print("[OLED] Could not initialize display")

init_oled()


# ============================================================================
# WIFI
# ============================================================================

def connect_wifi():
    """Connect to WiFi network (Wokwi-GUEST for simulator)."""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    if wlan.isconnected():
        print("[WiFi] Already connected:", wlan.ifconfig()[0])
        return True

    print("[WiFi] Connecting to", WIFI_SSID, "...")
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)

    timeout = 20
    while not wlan.isconnected() and timeout > 0:
        time.sleep(1)
        timeout -= 1
        print("[WiFi] Waiting... (%ds)" % timeout)

    if wlan.isconnected():
        print("[WiFi] Connected! IP:", wlan.ifconfig()[0])
        return True
    else:
        print("[WiFi] Connection failed!")
        return False


# ============================================================================
# SENSOR READING
# ============================================================================

def read_sensors():
    """Read DHT22 temperature and simulated heart rate from potentiometer.

    Returns (temperature, heart_rate) or (None, None) on error.
    """
    # Temperature from DHT22
    try:
        dht_sensor.measure()
        temperature = dht_sensor.temperature()
    except OSError:
        print("[Sensor] DHT22 read error")
        temperature = None

    # Heart rate from potentiometer (simulated — same as Phase 3)
    raw = hr_adc.read()
    heart_rate = int(HR_MIN + (raw / ADC_MAX) * (HR_MAX - HR_MIN))

    return temperature, heart_rate


# ============================================================================
# ALERT EVALUATION (from Phase 3 thresholds)
# ============================================================================

def evaluate_alert(temp, hr):
    """Classify readings as NORMAL, WARNING, or CRITICAL.

    Ported from Phase 3 health thresholds.
    """
    if temp is None:
        return "UNKNOWN"

    # Critical conditions
    if temp > TEMP_WARNING_MAX or hr > HR_WARNING_MAX or hr < HR_MIN:
        return "CRITICAL"

    # Warning conditions
    if temp > TEMP_NORMAL_MAX or hr > HR_NORMAL_MAX or hr < HR_NORMAL_MIN:
        return "WARNING"

    return "NORMAL"


# ============================================================================
# LED CONTROL
# ============================================================================

def set_leds(alert_level):
    """Control LEDs based on alert level (same logic as Phase 3)."""
    led_green.value(0)
    led_yellow.value(0)
    led_red.value(0)

    if alert_level == "NORMAL":
        led_green.value(1)
    elif alert_level == "WARNING":
        led_yellow.value(1)
    elif alert_level == "CRITICAL":
        led_red.value(1)
    else:
        # Unknown — blink red
        led_red.value(1)


# ============================================================================
# OLED DISPLAY
# ============================================================================

def display_readings(temp, hr, alert_level, wifi_ok, send_ok):
    """Show sensor data on OLED display.

    Layout (128x64):
      Line 0: "CardioIA IoT"
      Line 1: "Temp: 36.5 C"
      Line 2: "HR:   72 bpm"
      Line 3: "Status: NORMAL"
      Line 4: "WiFi:OK  API:OK"
    """
    if oled is None:
        return

    oled.fill(0)

    # Header
    oled.text("CardioIA IoT", 16, 0)

    # Temperature
    if temp is not None:
        oled.text("Temp: %.1f C" % temp, 0, 16)
    else:
        oled.text("Temp: --.- C", 0, 16)

    # Heart rate
    oled.text("HR:   %d bpm" % hr, 0, 28)

    # Alert status
    oled.text("Status: %s" % alert_level, 0, 40)

    # Connection status
    wifi_str = "OK" if wifi_ok else "NO"
    api_str = "OK" if send_ok else "NO"
    oled.text("WiFi:%s API:%s" % (wifi_str, api_str), 0, 52)

    oled.show()


def display_startup():
    """Show boot screen on OLED."""
    if oled is None:
        return

    oled.fill(0)
    oled.text("CardioIA", 32, 8)
    oled.text("IoT Monitor", 20, 24)
    oled.text("Phase 7", 36, 40)
    oled.text("Starting...", 24, 52)
    oled.show()


# ============================================================================
# HTTP POST TO BACKEND
# ============================================================================

def send_to_backend(temp, hr):
    """POST sensor data to backend /api/sensors endpoint.

    Returns True if successful, False otherwise.
    """
    if temp is None:
        return False

    payload = {
        "temperature": temp,
        "heart_rate": hr,
        "device_id": DEVICE_ID,
    }

    try:
        response = requests.post(
            BACKEND_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        success = response.status_code == 200
        if success:
            data = response.json()
            alert = data.get("alert", None)
            print("[API] Sent OK — backend alert:", alert)
        else:
            print("[API] Error:", response.status_code)
        response.close()
        return success
    except Exception as e:
        print("[API] Request failed:", e)
        return False


# ============================================================================
# MAIN LOOP
# ============================================================================

def main():
    """Main monitoring loop — ported from Phase 3 Arduino loop()."""
    print("=" * 50)
    print("CardioIA IoT Monitor — MicroPython (Phase 7)")
    print("Ported from Phase 3 sketch.ino")
    print("=" * 50)

    display_startup()
    time.sleep(2)

    # Connect WiFi
    wifi_ok = connect_wifi()
    set_leds("NORMAL" if wifi_ok else "UNKNOWN")

    reading_count = 0
    send_ok = False

    print("[Main] Starting sensor loop (interval: %dms)" % SENSOR_INTERVAL_MS)

    while True:
        reading_count += 1

        # 1. Read sensors
        temp, hr = read_sensors()

        # 2. Evaluate alert
        alert_level = evaluate_alert(temp, hr)

        # 3. Control LEDs
        set_leds(alert_level)

        # 4. Display on OLED
        display_readings(temp, hr, alert_level, wifi_ok, send_ok)

        # 5. Log to serial
        temp_str = "%.1f" % temp if temp is not None else "--.-"
        print(
            "[#%d] Temp=%s°C HR=%dbpm Alert=%s"
            % (reading_count, temp_str, hr, alert_level)
        )

        # 6. Send to backend (if WiFi connected)
        if wifi_ok:
            send_ok = send_to_backend(temp, hr)
        else:
            # Try to reconnect periodically
            if reading_count % 10 == 0:
                print("[WiFi] Attempting reconnection...")
                wifi_ok = connect_wifi()

        # 7. Wait for next cycle
        time.sleep_ms(SENSOR_INTERVAL_MS)


# Entry point
if __name__ == "__main__":
    main()
