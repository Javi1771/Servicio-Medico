// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dkohopldz', // Tu "cloud name"
  api_key: '624963113487674', // Tu API Key
  api_secret: 'pn6KYfg25ZG7iEbRzM8ho02smtQ', // Tu API Secret
});

module.exports = cloudinary;
