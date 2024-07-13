const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const qs = require('qs');

const app = express();

const clientID = '40258c09af13ef5f';
const clientSecret = 'd66032826f7651c6e938726824bba6acfe5bc6fd';
const redirectURI = 'http://localhost:3000/auth/pipedrive/callback';

let accessToken = ''; // Variable to store the access token
let refreshToken = ''; // Variable to store the refresh token

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route handling
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for Pipedrive authorization
app.get('/auth/pipedrive', (req, res) => {
  const authUrl = `https://oauth.pipedrive.com/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code&scope=deals:full_access`;
  res.redirect(authUrl);
});

// Callback route for Pipedrive authorization
app.get('/auth/pipedrive/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const response = await axios.post('https://oauth.pipedrive.com/oauth/token', qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectURI,
      client_id: clientID,
      client_secret: clientSecret
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;

    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);

    res.redirect('/success');
  } catch (error) {
    console.error('Error fetching tokens:', error.response ? error.response.data : error.message);
    res.status(500).send('Authentication failed');
  }
});

app.get('/success', (req, res) => {
  res.send('Successful authorization! You can now use the application.');
});

// New handler for form submission and job creation
app.post('/submit-form', async (req, res) => {
  const formData = req.body;
  console.log('Received form data:', formData);

  // Create an object for the job
  const jobData = {
    title: `${formData['first-name']} ${formData['last-name']} - ${formData['job-type']}`,
    value: formData['value'],
    currency: formData['currency'],
    user_id: formData['user_id'],
    '00f92c8f200b83ce48bd001fb1534c8ae424b5da': formData['area'],
    '059d74ca635e115599fb1249663a35475de1c9fe': formData['start-time'],
    '059d74ca635e115599fb1249663a35475de1c9fe_timezone_id': 310,
    '122180529be0732b0beb039a13c3165442e6f9e9': formData['address'],
    '2448aa7dee8f4a5b3cc0ab01063221ae27286239': formData['job-type'],
    '27d8cdbddfca012b8fae6f07888e43585f4891f2': formData['end-time'],
    '27d8cdbddfca012b8fae6f07888e43585f4891f2_timezone_id': 310,
    '4270025776a7eb96f6e49ebace4292fbb86bddbc': formData['zip-code'],
    '5915c3b31d1c79c1c46337d2a23a8b4527e37ee5': formData['job-source'],
    '604f3c2a1fd7de5bbc0b0ccfcdcc89988786a9f1': formData['value'],
    '64fc10bcad365a1a526b7bbc99aaca9932fcff3c': formData['city'],
    '78ce149bc30fcd9165ca386ddecf0ada21d075c0': formData['state'],
    '84474cd1dd5b8bdac56e6afa9a5c10130729f9e3': formData['email'],
    '87a7207f5e997df557e8859fc78610f300440ed0': formData['start-date'],
    '928bc5b052ce0e16db5947eb1e41adba24c90c43': formData['last-name'],
    'a89621ba24ebe80cd14df9c6be3b0d364ab4d15c': formData['phone'],
    'c887e811c003ef6c51315cff6cd35f64b01b2448': formData['job-description'],
    'cacad5fae065b5f6707757b53e2091a798647ce0': formData['first-name']
  };

  try {
    const response = await axios.post('https://api.pipedrive.com/v1/deals', jobData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('Pipedrive API response:', response.data);
    res.json({ message: 'Job created successfully', deal: response.data });
  } catch (error) {
    console.error('Error creating job:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error creating job' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
