const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors'); // CORS middleware

// Initialize express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS for all origins

// Set up MongoDB connection
mongoose.connect('mongodb+srv://pytripsa1:UkPEVp8DjHIlwKTj@homepageimage.asrxp.mongodb.net/?retryWrites=true&w=majority&appName=HomePageImage', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Create image schema with description and mapUrl
const imageSchema = new mongoose.Schema({
  name: String,
  description: String,  // Image description
  mapUrl: String,       // Map URL
  data: Buffer,
  contentType: String
});

const Image = mongoose.model('Image', imageSchema);

// Set up Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// CRUD Operations for Image

// Create/Upload an image with name, description, and map URL
app.post('/upload', upload.single('image'), (req, res) => {
  const imageName = req.body.name;
  const description = req.body.description;  // Image description
  const mapUrl = req.body.mapUrl;  // Map URL

  if (!imageName || !req.file) {
    return res.status(400).json({ message: 'Image name and file are required' });
  }

  const newImage = new Image({
    name: imageName,
    description: description, // Store the description
    mapUrl: mapUrl,           // Store the map URL
    data: req.file.buffer,
    contentType: req.file.mimetype
  });

  newImage.save()
    .then(() => res.status(200).json({ message: 'Image uploaded successfully' }))
    .catch(err => res.status(500).json({ error: err }));
});

// Read/Get all images and convert them to Base64
app.get('/images', (req, res) => {
  Image.find()
    .then(images => {
      const imageArray = images.map(image => ({
        id: image._id,
        name: image.name,
        description: image.description,  // Include description
        mapUrl: image.mapUrl,            // Include map URL
        data: image.data.toString('base64'), // Convert image buffer to Base64 string
        contentType: image.contentType
      }));
      res.status(200).json(imageArray);
    })
    .catch(err => res.status(500).json({ error: err }));
});

// Update an image (name, description, mapUrl, and file)


// Update image endpoint with file upload
app.put('/update/:id', upload.single('image'), (req, res) => {
  const imageId = req.params.id;
  const imageName = req.body.name;
  const description = req.body.description;
  const mapUrl = req.body.mapUrl;

  const updateData = {
    name: imageName,
    description: description,
    mapUrl: mapUrl,
  };

  if (req.file) {
    // If new image is provided, update the file
    updateData.data = req.file.buffer;
    updateData.contentType = req.file.mimetype;
  }

  // Find the image by ID and update it
  Image.findByIdAndUpdate(imageId, updateData, { new: true })
    .then(updatedImage => {
      if (updatedImage) {
        res.status(200).json({ message: 'Image updated successfully', updatedImage });
      } else {
        res.status(404).json({ message: 'Image not found' });
      }
    })
    .catch(err => res.status(500).json({ error: err }));
});

// Delete an image by ID
app.delete('/delete/:id', (req, res) => {
  Image.findByIdAndDelete(req.params.id)
    .then((image) => {
      if (image) {
        res.status(200).json({ message: 'Image deleted successfully' });
      } else {
        res.status(404).json({ message: 'Image not found' });
      }
    })
    .catch(err => res.status(500).json({ error: err }));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
