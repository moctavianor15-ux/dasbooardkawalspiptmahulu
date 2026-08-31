// netlify/functions/proxy.js
const https = require('https');

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzHdpP3bEl5CGIDpTeQTXRGx1VlO9AQLK4fEEWlKDlNqmZRu0CLb3lAl9X6DUFwKLY/exec'; // URL APPS SCRIPT ANDA

exports.handler = async (event) => {
  try {
    let params = {};

    // Ambil parameter dari body (POST) atau query string (GET)
    if (event.httpMethod === 'POST') {
      if (event.body) {
        params = JSON.parse(event.body);
      }
    } else {
      const url = new URL(event.path, `https://${event.headers.host}`);
      params = Object.fromEntries(url.searchParams);
    }

    // Pastikan action ada
    if (!params.action) {
      const url = new URL(event.path, `https://${event.headers.host}`);
      params.action = url.searchParams.get('action');
    }

    // Bangun query string
    const queryString = new URLSearchParams(params).toString();
    const targetUrl = APPS_SCRIPT_URL + (queryString ? `?${queryString}` : '');

    // Panggil Apps Script
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.text();

    // CEK APAKAH RESPONS BERUPA JSON
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      // Jika bukan JSON, kembalikan JSON error yang jelas
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'error',
          message: `Apps Script mengembalikan respons bukan JSON. Kemungkinan deployment belum publik atau URL salah. Cuplikan respons: ${data.substring(0, 200)}`,
        }),
      };
    }

    // Jika JSON, kirimkan apa adanya
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsed),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'error', message: error.toString() }),
    };
  }
};
