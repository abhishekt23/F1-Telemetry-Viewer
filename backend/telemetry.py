import sys
import json
import fastf1
import os

# Enable FastF1 cache
CACHE_DIR = "fastf1_cache"
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

fastf1.Cache.enable_cache(CACHE_DIR)

def fetch_telemetry(driver_code, track_name, year, session_type):
    try:
        session = fastf1.get_session(int(year), track_name, session_type)
        session.load()

        laps = session.laps.pick_driver(driver_code)
        if laps.empty:
            return {"error": f"No data for driver {driver_code} at {track_name} in {year} {session_type}"}

        fastest_lap = laps.pick_fastest()
        telemetry = fastest_lap.get_car_data()
        
        return {
            "driver": driver_code,
            "track": track_name,
            "year": year,
            "session_type": session_type,
            "fastest_lap_time": fastest_lap['LapTime'].total_seconds(),
            "sector_times": [
                fastest_lap['Sector1Time'].total_seconds(),
                fastest_lap['Sector2Time'].total_seconds(),
                fastest_lap['Sector3Time'].total_seconds(),
            ],
            "speed": telemetry['Speed'].tolist(),
            "throttle": telemetry['Throttle'].tolist(),
            "brake": telemetry['Brake'].tolist(),
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    driver, track, year, session = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    telemetry_data = fetch_telemetry(driver, track, year, session)
    print(json.dumps(telemetry_data))
