# SGA Render Studio

AI-powered architectural drawing cleanup and presentation rendering platform.

## Current Frontend
Built with:
- React
- Tailwind
- Lovable

## Planned Backend
Backend stack:
- FastAPI
- PyMuPDF
- OpenCV
- Pillow

## Backend Tasks

### Endpoints
- POST /extract-pdf
- POST /clean-image
- GET /generated/{filename}

### Requirements
- convert PDF pages to PNG immediately
- preserve real sheet previews
- clean linework with OpenCV
- remove dimensions/notes/title blocks
- preserve geometry
- enable cleaned PNG download

## Future Features
- AI rendering
- Firefly integration
- firm presets
- batch processing
- ControlNet rendering
- presentation exports
