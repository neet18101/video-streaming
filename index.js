
import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import {exec} from "child_process"

const app = express();

app.use(cors({
    origin:["http://localhost:3000", "http://localhost:5173"],
    credentials: true
}));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");  
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
})
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = uuidv4();
        cb(null, "file-" + uniqueSuffix + "-" + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post("/upload", upload.single("file"), (req, res) => {
    const file = req.file;
    const lessionId = uuidv4();
    const videoPath=req.file.path;
    const outputPath=`./uploads/courses/${lessionId}`;
    const hlsPath=`${outputPath}/index.m3u8`;
    console.log("hlsPath",hlsPath);

    if(!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath,{recursive:true});
    }
const ffmpegCommand = `ffmpeg -i "${videoPath}" -codec:v libx264 -codec:a aac -f hls \
-hls_time 10 -hls_playlist_type vod \
-hls_segment_filename "${outputPath}/%03d.ts" \
-start_number 0 "${hlsPath}"`;

// no queue beacuse of POC not for production
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    const videoPath = `http://localhost:8083/uploads/courses/${lessionId}/index.m3u8`;
    // if (stderr) {
    //   console.error(`Stderr: ${stderr}`);
    //   return;
    // }
    // console.log(`stdout: ${stdout}`);
    res.json({
        message: "video convert to hls",
        videoPath: videoPath,
        lessionId: lessionId
    })
  });

    // res.status(200).json(file.filename);
});

app.listen(8083, () => {
    console.log("Server is running on port 8083");
});