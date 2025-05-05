import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from './context/AuthContext';
import GlobalStyle from './styles/GlobalStyle';
import theme from './styles/theme';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardLayout from './components/dashboard/DashboardLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import Articles from './pages/Articles';
import Dashboard from './pages/Dashboard';
import UserManagement from './components/dashboard/UserManagement';
import Lectures from './components/dashboard/Lectures';
import ContentManagement from './components/dashboard/ContentManagement';
import DashboardEvents from './components/dashboard/DashboardEvents';
import DashboardHome from './components/dashboard/DashboardHome';
import DashboardCryptoIIITD from './components/dashboard/DashboardCryptoIIITD';
import Events from './pages/Events';
import LecturesPage from './pages/Lectures';
import CryptoIIITD from './pages/CryptoIIITD';
// import CryptoIIITD from './components/dashboard/CryptoIIITD';

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <AuthProvider>
          <Routes>
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="lectures" element={<Lectures />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="resources" element={<Dashboard />} />
              <Route path="events" element={<DashboardEvents />} />
              <Route path="crypto-iiitd" element={<DashboardCryptoIIITD />} />
              <Route path="settings" element={<Profile />} />
              {/* <Route path="crypto-iiitd" element={<CryptoIIITD />} /> */}
            </Route>
            
            {/* Regular Routes with Navbar and Footer */}
            <Route path="/" element={<>
              <Navbar />
              <main>
                <Home />
              </main>
              <Footer />
            </>} />
            
            <Route path="/articles" element={<>
              <Navbar />
              <main>
                <Articles />
              </main>
              <Footer />
            </>} />
            
            <Route path="/login" element={<>
              <Navbar />
              <main>
                <Login />
              </main>
              <Footer />
            </>} />
            
            <Route path="/register" element={<>
              <Navbar />
              <main>
                <Register />
              </main>
              <Footer />
            </>} />
            
            <Route path="/forgot-password" element={<>
              <Navbar />
              <main>
                <ForgotPassword />
              </main>
              <Footer />
            </>} />

            <Route path="/resources" element={<>
              <Navbar />
              <main>
                <Resources />
              </main>
              <Footer />
            </>} />
            
            <Route path="/resources/:id" element={<>
              <Navbar />
              <main>
                <ResourceDetail />
              </main>
              <Footer />
            </>} />
            
            <Route path="/profile" element={<>
              <Navbar />
              <main>
                <Profile />
              </main>
              <Footer />
            </>} />

            <Route path="/events" element={<>
              <Navbar />
              <main>
                <Events />
              </main>
              <Footer />
            </>} />

            <Route path="/lectures" element={<>
              <Navbar />
              <main>
                <LecturesPage />
              </main>
              <Footer />
            </>} />

            <Route path="/about-cryptography" element={<>
              <Navbar />
              <main>
                <CryptoIIITD />
              </main>
              <Footer />
            </>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
