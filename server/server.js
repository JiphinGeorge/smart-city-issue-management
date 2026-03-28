const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const clientPath = path.join(__dirname, '../client');
const dataPath = path.join(__dirname, '../data');
const issuesFilePath = path.join(dataPath, 'issues.json');
const usersFilePath = path.join(dataPath, 'users.json');

app.use(express.json());
app.use(express.static(clientPath));

// --- HTML Routes ---
app.get('/', (req, res) => res.sendFile(path.join(clientPath, 'index.html')));
app.get('/details', (req, res) => res.sendFile(path.join(clientPath, 'details.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(clientPath, 'admin.html')));
app.get('/analytics', (req, res) => res.sendFile(path.join(clientPath, 'analytics.html')));
app.get('/login', (req, res) => res.sendFile(path.join(clientPath, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(clientPath, 'register.html')));

// ... details, admin, analytics routes ...

// --- Helper Functions ---
const readData = () => JSON.parse(fs.readFileSync(issuesFilePath, 'utf8'));
const writeData = (data) => fs.writeFileSync(issuesFilePath, JSON.stringify(data, null, 2));

const readUsers = () => JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
const writeUsers = (data) => fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2));

// --- API Routes ---
// POST: Login Authentication
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    try {
        const data = readUsers();
        const user = data.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            const redirectUrl = user.role === 'admin' ? '/admin' : '/';
            return res.json({ success: true, role: user.role, name: user.name, redirectUrl });
        } else {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }
    } catch(err) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST: Registration
app.post('/api/register', (req, res) => {
    const { name, email, password, ward } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    try {
        const data = readUsers();
        if (data.users.some(u => u.email === email)) {
            return res.status(409).json({ success: false, error: 'Email already in use' });
        }
        
        const newUser = { email, password, name, ward, role: 'user' };
        data.users.push(newUser);
        writeUsers(data);
        
        return res.json({ success: true, role: 'user', redirectUrl: '/' });
    } catch(err) {
        return res.status(500).json({ success: false, error: 'Failed to create account' });
    }
});
// GET: Fetch all issues
app.get('/api/issues', (req, res) => {
    try {
        res.json(readData());
    } catch (err) {
        res.status(500).json({ error: "Failed to read data." });
    }
});

// POST: Add a new issue
app.post('/api/issues', (req, res) => {
    try {
        const data = readData();
        const newIssue = {
            id: Math.floor(10000 + Math.random() * 90000).toString(), // Generate random ID
            timestamp: new Date().toISOString(),
            status: "Pending",
            ...req.body
        };
        
        data.issues.unshift(newIssue); // Add to beginning of array
        data.summary.total += 1;
        data.summary.pending += 1;
        
        writeData(data);
        res.status(201).json(newIssue);
    } catch (err) {
        res.status(500).json({ error: "Failed to save issue." });
    }
});

// PUT: Update an issue (e.g., Mark as Resolved)
app.put('/api/issues/:id', (req, res) => {
    try {
        const data = readData();
        const index = data.issues.findIndex(i => i.id === req.params.id);
        
        if (index !== -1) {
            // Update stats if status changed to Resolved
            if (data.issues[index].status !== 'Resolved' && req.body.status === 'Resolved') {
                data.summary.pending -= 1;
                data.summary.resolved += 1;
            }
            
            data.issues[index] = { ...data.issues[index], ...req.body };
            writeData(data);
            res.json(data.issues[index]);
        } else {
            res.status(404).json({ error: "Issue not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to update issue." });
    }
});

// DELETE: Delete an issue
app.delete('/api/issues/:id', (req, res) => {
    try {
        const data = readData();
        const issue = data.issues.find(i => i.id === req.params.id);
        
        if (issue) {
            data.issues = data.issues.filter(i => i.id !== req.params.id);
            data.summary.total -= 1;
            if (issue.status === 'Pending') data.summary.pending -= 1;
            if (issue.status === 'Resolved') data.summary.resolved -= 1;
            
            writeData(data);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Issue not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to delete issue." });
    }
});

// POST: Mock AI Analysis
app.post('/api/analyze', (req, res) => {
    const { description } = req.body;
    const descLower = description.toLowerCase();
    
    // Simple keyword matching to simulate AI
    let category = "Infrastructure";
    let priority = "Medium";
    let title = "New Report";

    if (descLower.includes('water') || descLower.includes('leak') || descLower.includes('pipe')) {
        category = "Utilities"; priority = "High"; title = "Water Leakage";
    } else if (descLower.includes('trash') || descLower.includes('garbage') || descLower.includes('bin')) {
        category = "Waste"; priority = "Medium"; title = "Waste Management Issue";
    } else if (descLower.includes('light') || descLower.includes('dark')) {
        category = "Electric"; priority = "High"; title = "Lighting Issue";
    } else if (descLower.includes('pothole') || descLower.includes('road')) {
        category = "Road"; priority = "High"; title = "Road Damage";
    }

    // Simulate network delay for AI feel
    setTimeout(() => {
        res.json({ category, priority, title, description });
    }, 800);
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));