# PDF Setup Instructions for MangaVerse

## Issue: PDFs Not Showing

The PDFs aren't showing because the browser needs to serve the files through a web server due to CORS (Cross-Origin Resource Sharing) restrictions.

## Solutions:

### Option 1: Use a Local Web Server (Recommended)

1. **Install Python** (if not already installed)
2. **Navigate to your manga verse folder** in terminal/command prompt
3. **Run one of these commands:**

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have it)
npx http-server -p 8000

# PHP (if you have it)
php -S localhost:8000
```

4. **Open your browser** and go to: `http://localhost:8000`
5. **Test the PDF loading** by visiting: `http://localhost:8000/test-pdf.html`

### Option 2: Use Live Server Extension (VS Code)

1. **Install Live Server extension** in VS Code
2. **Right-click on index.html** and select "Open with Live Server"
3. **Test the PDF functionality**

### Option 3: Use XAMPP/WAMP

1. **Install XAMPP or WAMP**
2. **Copy your manga verse folder** to the web server directory
3. **Access via localhost**

## Testing Steps:

1. **Open the test page**: `http://localhost:8000/test-pdf.html`
2. **Check browser console** for any errors
3. **Verify PDF files exist** in the "Demon Slayer" folder
4. **Test the main reader**: `http://localhost:8000/reader.html`

## File Structure Should Be:

```
manga verse/
├── Demon Slayer/
│   ├── Demon Slayer [Volume 01].pdf
│   ├── Demon Slayer [Volume 02].pdf
│   └── ... (all 23 volumes)
├── index.html
├── reader.html
├── chapters.html
└── ... (other files)
```

## Common Issues:

1. **CORS Error**: Use a web server (not file:// protocol)
2. **File Not Found**: Check file names match exactly
3. **PDF.js Error**: Ensure PDF.js is loaded correctly

## Debug Information:

- Check browser console for errors
- Verify PDF files are accessible via direct URL
- Test with a simple PDF first

## Quick Test:

1. Start a local server
2. Visit: `http://localhost:8000/test-pdf.html`
3. Check if the PDF loads and displays
4. If successful, test the main reader
