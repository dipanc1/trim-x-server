const router = require('express').Router();
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
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

router.post('/trim', upload.single('file'), async (req, res) => {
    try {
        const { startTime, duration } = req.body;

        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const filePath = req.file.path;

        if (isNaN(parseFloat(startTime))) {
            return res.status(400).send('startTime must be a number');
        }

        if (isNaN(parseFloat(duration))) {
            return res.status(400).send('duration must be a number');
        }

        const trimmedFilePath = await trimFile(filePath, startTime, duration);

        res.download(trimmedFilePath, async () => {
            console.log('File sent');
            await cleanupFiles([filePath, trimmedFilePath]);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

function trimFile(filePath, startTime, duration) {
    return new Promise((resolve, reject) => {
        const outputFilePath = filePath.replace('.mp3', '-trimmed.mp3');
        ffmpeg(filePath)
            .setStartTime(startTime)
            .setDuration(duration)
            .output(outputFilePath)
            .on('end', () => {
                console.log('Trimming finished');
                resolve(outputFilePath);
            })
            .on('error', (err) => {
                console.error(err);
                reject(err);
            })
            .run();
    });
}

async function cleanupFiles(filePaths) {
    try {
        await Promise.all(filePaths.map(filePath => fs.unlink(filePath)));
        console.log('Cleanup completed');
    } catch (err) {
        console.error('Error during cleanup', err);
    }
}

module.exports = router;