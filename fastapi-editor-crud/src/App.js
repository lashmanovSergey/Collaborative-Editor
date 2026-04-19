import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Login'
import Profile from './Profile'
import Register from './Register'
import Document from './Document'

function App() {
    return (
        <Router>
            <Routes>
                <Route path='/auth' element={<Login />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/register' element={<Register />} />
                <Route path='/rooms/:roomId/documents/:documentId' element={<Document />} />
            </Routes>
        </Router>
    )
}

export default App;