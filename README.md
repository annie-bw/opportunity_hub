# 🎥 Demo Video

https://www.loom.com/share/839a7cd8f4534c958c69df8bff0dbd38


# OPPORTUNITY SEARCH PREVIEW

<img width="1914" height="665" alt="image" src="https://github.com/user-attachments/assets/f384d85d-dda2-4e93-a157-027a48183f78" />







# Global Opportunity Hub 🌍

A web application that aggregates and displays global opportunities including internships, fellowships, grants, and competitions for students and companies. The platform uses Google Custom Search API to fetch real-time opportunities from across the web.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [APIs Used](#apis-used)
- [Local Setup](#local-setup)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Challenges & Solutions](#challenges--solutions)
- [Credits](#credits)

## ✨ Features

- **Real-time Opportunity Search**: Fetches latest opportunities from multiple sources
- **Category Filtering**: 
  - Student opportunities (internships, fellowships, summits, competitions)
  - Company opportunities (tech grants, agriculture, environment)
- **Manual Search**: Quick search functionality for specific opportunities
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Load-balanced Deployment**: High availability through multi-server architecture

## 🛠 Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Modular ES6+ architecture

**Backend:**
- Node.js with Express.js
- RESTful API architecture

**Infrastructure:**
- Nginx (reverse proxy and static file server)
- PM2 (process management)
- HAProxy Load Balancer
- Ubuntu 20.04 LTS servers

## 🔌 APIs Used

### Google Custom Search JSON API
- **Purpose**: Fetches opportunity listings from indexed web sources
- **Documentation**: [Google Custom Search API](https://developers.google.com/custom-search/v1/overview)
- **Rate Limits**: 100 queries per day (free tier)
- **Implementation**: Secured on backend to protect API keys

## 🚀 Local Setup

### Prerequisites
```bash
- Node.js (v14 or higher)
- npm or yarn
- Git
```

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/opportunity-hub.git
cd opportunity-hub
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Configure environment variables**
```bash
# Create .env file in backend directory
touch .env
```

Add the following to `.env`:
```env
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
PORT=3000
```

4. **Start the backend server**
```bash
npm start
# or for development with auto-reload
npm run dev
```

5. **Serve the frontend**

Option A - Simple HTTP Server (Python):
```bash
cd ../frontend
python3 -m http.server 8080
```

Option B - Live Server (VS Code extension):
- Open frontend folder in VS Code
- Right-click on `index.html` → "Open with Live Server"

6. **Access the application**
```
http://localhost:8080
```

## 🌐 Deployment

### Server Requirements
- 2 Ubuntu 20.04 LTS servers (web-01, web-02)
- 1 Load balancer server
- Domain name with SSL certificate

### Deployment Steps

#### On Each Web Server (web-01, web-02):

1. **Install dependencies**
```bash
sudo apt update
sudo apt install -y nginx nodejs npm git
sudo npm install -g pm2
```

2. **Clone and setup application**
```bash
cd /var/www/
sudo git clone https://github.com/yourusername/opportunity-hub.git annie-bw.tech
cd annie-bw.tech/backend
sudo npm install
```

3. **Configure environment**
```bash
sudo nano /var/www/annie-bw.tech/backend/.env
# Add API keys as shown above
```

4. **Start backend with PM2**
```bash
cd /var/www/annie-bw.tech/backend
pm2 start server.js --name annie-backend
pm2 save
pm2 startup
# Follow the command it outputs
```

5. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/annie-bw.tech
```

Add this configuration:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name annie-bw.tech www.annie-bw.tech;

    add_header X-Served-By $hostname;
    
    root /var/www/annie-bw.tech/frontend;
    index opportunity.html;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /opportunity.html =404;
    }
}
```

6. **Enable site and restart Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/annie-bw.tech /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

7. **Set proper permissions**
```bash
sudo chown -R www-data:www-data /var/www/annie-bw.tech
sudo chmod -R 755 /var/www/annie-bw.tech
sudo chmod 644 /var/www/annie-bw.tech/frontend/*.{css,js,html}
```

#### On Load Balancer:

Configure HAProxy to distribute traffic between web-01 and web-02. SSL termination should be handled at the load balancer level.

## 🏗 Architecture

```
                    [Users]
                       |
                       ↓
            [Load Balancer (SSL)]
                       |
        ┌──────────────┴──────────────┐
        ↓                             ↓
    [web-01]                      [web-02]
    Nginx (Port 80)               Nginx (Port 80)
        ↓                             ↓
    Backend (Port 3000)           Backend (Port 3000)
        ↓                             ↓
    [Google Custom Search API]
```

### Request Flow:
1. User accesses `https://annie-bw.tech`
2. Load balancer terminates SSL and forwards HTTP request
3. Request reaches either web-01 or web-02
4. Nginx serves static files or proxies API requests
5. Backend fetches data from Google Custom Search API
6. Response returns through the same path

## 🚧 Challenges & Solutions

### Challenge 1: API Key Security
**Problem**: Initial implementation exposed API keys in frontend code.

**Solution**: Implemented a backend proxy server that securely stores API keys in environment variables and handles all API requests server-side.

### Challenge 2: Static File 404 Errors
**Problem**: JavaScript and CSS files returned 404 errors when accessed through the domain.

**Solution**: 
- Used absolute paths (`/file.js`) instead of relative paths (`./file.js`)
- Configured Nginx `root` directive properly
- Ensured files had correct permissions (644)

### Challenge 3: Browser Caching Issues
**Problem**: Old 404 responses were cached by browsers during development.

**Solution**: 
- Implemented proper cache headers
- Used hard refresh during testing
- Tested in incognito mode to verify fixes

### Challenge 4: Load Balancer SSL Configuration
**Problem**: SSL certificates needed to be on load balancer, not individual servers.

**Solution**: Configured SSL termination at load balancer level, with backend servers communicating via HTTP.

### Challenge 5: Cross-Server Deployment
**Problem**: Maintaining consistent configuration across multiple servers.

**Solution**: 
- Created deployment scripts
- Used version control for configuration files
- Documented exact deployment steps

## 📚 Credits

### APIs & Services
- **Google Custom Search API** - [Google](https://developers.google.com/custom-search)
  - Used for fetching opportunity listings from indexed sources

### Libraries & Tools
- **Express.js** - [Express](https://expressjs.com/) - Web framework for Node.js
- **PM2** - [PM2.io](https://pm2.io/) - Process manager for Node.js
- **Nginx** - [Nginx.org](https://nginx.org/) - Web server and reverse proxy

### Resources
- MDN Web Docs for JavaScript best practices
- Nginx documentation for server configuration
- Node.js documentation for backend development

## 📝 License

This project is created for educational purposes as part of a web development assignment.

## 👤 Author

**BWIZA Annie Pierre**
- GitHub: (https://github.com/annie-bw/opportunity_hub)
- Project Link: [https://github.com/annie-bw/opportunity-hub](https://github.com/annie-bw/opportunity-hub)


