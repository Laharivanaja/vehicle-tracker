# 🚗 Vehicle Movement Tracker

A real-time vehicle movement simulation application built with React, React-Leaflet, and Tailwind CSS for frontend developer internship assignment.

## 🌐 Live Demo
[vehicle-tracker-ee45j6443-laharivanajas-projects.vercel.app]

## ✨ Features

### Core Functionality
- **Interactive Map**: Leaflet.js with OpenStreetMap integration
- **Route Visualization**: 
  - Gray dashed line showing complete planned route
  - Red solid line showing traveled path (extends in real-time)
- **Smooth Vehicle Animation**: Animated transitions between GPS points using requestAnimationFrame
- **Real-time Metadata Display**:
  - Current GPS coordinates (Latitude/Longitude)
  - Live current time (updates every second)
  - Calculated speed using Haversine formula (km/h)
  - Elapsed time from route start
  - Progress indicator with percentage bar

### Controls
- **Play Button**: Start the simulation
- **Pause Button**: Pause the movement
- **Reset Button**: Return to starting point
- **Auto-pan**: Map follows vehicle automatically

### Technical Features
- Responsive design for desktop and mobile
- 22 GPS waypoints with timestamps
- Updates every 2 seconds
- Speed calculation: Distance ÷ Time
- Progress tracking: Visual bar + counter

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | Frontend framework |
| React-Leaflet | Map integration |
| Leaflet.js | Interactive mapping library |
| Tailwind CSS | Styling and responsive design |
| Vite | Build tool and dev server |

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Steps
```bash
# Clone the repository
git clone https://github.com/Laharivanaja/vehicle-tracker.git
cd vehicle-tracker

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure
```
vehicle-tracker/
├── public/
│   └── dummy-route.json          # 22 GPS coordinates with timestamps
├── src/
│   ├── App.jsx                   # Main component with all logic
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Tailwind CSS imports
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🧮 Technical Implementation

### Distance Calculation (Haversine Formula)
```javascript
const R = 6371; // Earth's radius in km
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLon = (lon2 - lon1) * Math.PI / 180;
const a = Math.sin(dLat/2) * Math.sin(dLat/2) + ...;
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
const distance = R * c;
```

### Speed Calculation
```javascript
Speed (km/h) = Distance (km) ÷ Time (hours)
```

### Smooth Animation
Uses `requestAnimationFrame` for 60fps smooth interpolation between GPS points.

## 📊 Data Format

The application uses `dummy-route.json` with the following structure:
```json
[
  {
    "latitude": 17.385044,
    "longitude": 78.486671,
    "timestamp": "2024-07-20T10:00:00Z"
  }
]
```

## 🎯 Assignment Requirements

✅ Map integration with mapping library  
✅ Vehicle marker with position updates  
✅ Route path visualization (polyline)  
✅ Dummy location data from JSON file  
✅ Simulated real-time movement  
✅ Play/Pause/Reset controls  
✅ Metadata display (coordinates, time, speed)  
✅ Responsive UI design  
✅ Route extends as vehicle moves  

## 👨‍💻 Developer

**[Yarlagadda Lahari Prasanna]**  
Email: [lahariprasannayarlagadda@gmail.com]  
GitHub: [@Laharivanaja](https://github.com/Laharivanaja)  


## 📝 License

This project was created as part of a frontend developer internship assignment.

