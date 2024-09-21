const router = require('express').Router();
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const multer = require('multer');

ffmpeg.setFfmpegPath(ffmpegPath);

const storage = multer.diskStorage({
    destination: (_, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (_, file, cb) => {
        cb(null, `${file.originalname}`);
    }
});

const upload = multer({ storage });

router.post('/trim', upload.single('file'), (req, res) => {
    const { startTime, duration } = req.body;

    // check if file is uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    const filePath = req.file.path;

    // check if startTime is a number
    if (Number.isNaN(parseFloat(startTime))) {
        return res.status(400).send('startTime must be a number');
    }

    // check if duration is a number
    if (Number.isNaN(parseFloat(duration))) {
        return res.status(400).send('duration must be a number');
    }

    // trim file
    ffmpeg(filePath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(`${filePath.replace('.mp3', '-trimmed.mp3')}`)
        .on('end', () => {
            console.log('Trimming finished');
        })
        .on('error', (err) => {
            console.error(err);
        })
        .run();

    const fileToDownload = filePath.replace('.mp3', '-trimmed.mp3');

    // send output file back
    res.download(fileToDownload, () => {
        console.log('File sent');
        cleanup(filePath, fileToDownload);
    });
});

function cleanup(filePath, fileToDownload) {
    setTimeout(() => {
        fs.unlink(filePath, (err) => {
            if (err) { }
        });
        fs.unlink(fileToDownload, (err) => {
            if (err) { }
        });
    }, 10000);
}

module.exports = router;