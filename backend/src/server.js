require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { router } = require("./routes");
const { authRouter } = require("./auth.routes");
const { adminRouter } = require("./admin.routes");
const { studentRouter } = require("./student.routes");



const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/student", studentRouter);



app.get("/", (req, res) => {
  res.json({ message: "EKEL-Sport API running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

