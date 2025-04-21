const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'media', maxCount: 1 }
]);

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/forecast', (req, res) => res.render('forecast'));

app.post('/predict', upload, (req, res) => {
  const { caption, hashtags, postTime, region, engagementGoal } = req.body;

  // Parse datetime
  const datetime = new Date(postTime);
  const dayOfWeek = datetime.toLocaleString('en-US', { weekday: 'long' });
  const timeOfDay = datetime.getHours();

  // Fake/fixed values for followers, likes, comments, etc. (replace with real logic if needed)
  const inputData = {
    followers: 10000,
    likes: 500,
    comments: 30,
    post_type: "image", // You can enhance this later using media type
    day_of_week: dayOfWeek,
    time_of_day: timeOfDay,
    hashtags_count: hashtags ? hashtags.split(',').length : 0
  };

  const py = spawn('python3', ['reach_predictor.py', JSON.stringify(inputData)]);

  let result = '';

  py.stdout.on('data', (data) => {
    result += data.toString();
  });

  py.stderr.on('data', (data) => {
    console.error(`Python error: ${data}`);
  });

  py.on('close', (code) => {
    try {
      const prediction = JSON.parse(result);
      res.render('result', { result: prediction });
    } catch (err) {
      console.error(err);
      res.render('result', { result: { reach: 'Error parsing prediction' } });
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
