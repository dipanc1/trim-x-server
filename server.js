const express = require('express');

const healthRouter = require('./routes/health');
const jobsRouter = require('./routes/jobs');

const app = express();

app.use('/api', jobsRouter);
app.use('/api', healthRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});