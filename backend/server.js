require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// Create an instance of OpenAI with the API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Telemetry fetch endpoint
app.get("/api/telemetry", (req, res) => {
    const { driver, track, year, session } = req.query;

    const pythonProcess = require("child_process").spawn("python3", [
        "telemetry.py",
        driver,
        track,
        year,
        session,
    ]);

    let result = "";
    pythonProcess.stdout.on("data", (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error(`Error from Python: ${data}`);
    });

    pythonProcess.on("close", (code) => {
        if (code === 0) {
            res.json(JSON.parse(result));
        } else {
            res.status(500).send("Failed to process telemetry data.");
        }
    });
});

// AI Analysis Endpoint
app.post("/api/analyze", async (req, res) => {
    const { telemetry } = req.body;

    if (!telemetry || !telemetry.driver1 || !telemetry.driver2) {
        return res.status(400).json({ error: "Invalid telemetry data." });
    }

    try {
        const prompt = `
Analyze the telemetry data for two drivers and provide insights:
- Compare sector times and identify strengths and weaknesses.
- Highlight differences in throttle, brake, and speed usage.
- Suggest possible strategies for improvement.

Telemetry Data:
Driver 1 (${telemetry.driver1.driver}):
- Sector Times: ${telemetry.driver1.sector_times}
- Speed: ${telemetry.driver1.speed.slice(0, 10)}... (truncated)
- Throttle: ${telemetry.driver1.throttle.slice(0, 10)}... (truncated)

Driver 2 (${telemetry.driver2.driver}):
- Sector Times: ${telemetry.driver2.sector_times}
- Speed: ${telemetry.driver2.speed.slice(0, 10)}... (truncated)
- Throttle: ${telemetry.driver2.throttle.slice(0, 10)}... (truncated)
`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
        });

        res.json({ analysis: response.choices[0].message.content.trim() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to analyze data using OpenAI." });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});
