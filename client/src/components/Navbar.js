import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import headerLogo from '../images/header-logo.png';
import { 
  FaLock, 
  FaUser, 
  FaBars, 
  FaTimes, 
  FaShieldAlt, 
  FaBook, 
  FaCalendarAlt,
  FaGraduationCap,
  FaInfoCircle,
  FaSearch,
  FaChevronDown,
  FaVideo,
  FaFilePdf,
  FaBookOpen,
  FaQuoteRight
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <NavbarContainer $scrolled={scrolled}>
      <div className="container">
        <NavbarContent>
          <Logo to="/">
            {/* <LogoIcon> */}
              {/* <FaLock /> */}
            {/* </LogoIcon> */}
            <img src={headerLogo} alt="Logo" style={{ width: '90px', height: '40px', marginRight: '0.5rem' }} />
            <LogoText></LogoText>
          </Logo>

          <SearchContainer>
            <SearchInput placeholder="Search..." />
            <SearchButton>
              <FaSearch />
            </SearchButton>
          </SearchContainer>

          <MenuToggle onClick={toggleMenu}>
            {isOpen ? <FaTimes /> : <FaBars />}
          </MenuToggle>

          <NavMenu $isOpen={isOpen}>
            <NavItem $active={isActive('/')}>
              <NavLink to="/" onClick={() => setIsOpen(false)}>
                Home
              </NavLink>
            </NavItem>
            
            <NavItem $active={location.pathname.includes('/resources')}>
              <NavLink to="/resources" onClick={() => setIsOpen(false)}>
                <FaBook />
                <span>Resources</span>
              </NavLink>
            </NavItem>
            
            <NavItem $active={isActive('/articles')}>
              <NavLink to="/articles" onClick={() => setIsOpen(false)}>
                Articles
              </NavLink>
            </NavItem>
            
            <NavItem $active={isActive('/events')}>
              <NavLink to="/events" onClick={() => setIsOpen(false)}>
                <FaCalendarAlt />
                <span>Events</span>
              </NavLink>
            </NavItem>
            
            <NavItem $active={isActive('/lectures')}>
              <NavLink to="/lectures" onClick={() => setIsOpen(false)}>
                <FaGraduationCap />
                <span>Lectures</span>
              </NavLink>
            </NavItem>
            
            <NavItem $active={isActive('/about-cryptography')}>
              <NavLink to="/about-cryptography" onClick={() => setIsOpen(false)}>
                <FaInfoCircle />
                <span>crypto@IIITD</span>
              </NavLink>
            </NavItem>
            
            {!user ? (
              <NavItem $active={isActive('/login')}>
                <NavLink to="/login" onClick={() => setIsOpen(false)}>
                  Login
                </NavLink>
              </NavItem>
            ) : (
              <>
                <NavItem $active={isActive('/profile')}>
                  <NavLink to="/profile" onClick={() => setIsOpen(false)}>
                    <FaUser />
                    <span>Profile</span>
                  </NavLink>
                </NavItem>
                
                {user.role === 'admin' && (
                  <NavItem $active={isActive('/admin/dashboard')}>
                    <NavLink to="/admin/dashboard" onClick={() => setIsOpen(false)}>
                      <FaShieldAlt />
                      <span>Admin</span>
                    </NavLink>
                  </NavItem>
                )}
              </>
            )}
          </NavMenu>
        </NavbarContent>
      </div>
    </NavbarContainer>
  );
};

const NavbarContainer = styled.nav`
  background-color: ${({ $scrolled }) => $scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)'};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
  padding: 15px;
  height: 60px;
  margin-top: 15px;
`;

const NavbarContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 1rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 700;
  font-size: 1.2rem;
  margin-right: 10px;
`;

const LogoIcon = styled.div`
  margin-right: 0.2rem;
  font-size: 1.2rem;
`;

const LogoText = styled.span``;

const MenuToggle = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.3rem;
  cursor: pointer;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

const NavMenu = styled.ul`
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
    padding: 0.8rem 0;
    transform: ${({ $isOpen }) => $isOpen ? 'translateY(0)' : 'translateY(-100%)'};
    opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
    visibility: ${({ $isOpen }) => $isOpen ? 'visible' : 'hidden'};
    transition: all 0.3s ease;
    z-index: 99;
    height: auto;
    max-height: 80vh;
    overflow-y: auto;
  }
`;

const NavItem = styled.li`
  height: 100%;
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0 5px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: ${({ $active }) => $active ? '100%' : '0'};
    height: 2px;
    background-color: ${({ theme }) => theme.colors.primary};
    transition: width 0.3s ease;
  }
  
  &:hover::after {
    width: 100%;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin: 0.4rem 0;
    width: 100%;
    text-align: center;
    
    &::after {
      display: none;
    }
  }
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  font-size: 0.85rem;
  transition: color 0.3s ease;
  height: 100%;
  
  svg {
    margin-right: 0.2rem;
    font-size: 0.85rem;
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    justify-content: center;
  }
`;

const DropdownToggle = styled.a`
  display: flex;
  align-items: center;
  padding: 0.4rem 0.7rem;
  color: ${({ theme, $isOpen }) => $isOpen ? theme.colors.primary : theme.colors.text};
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: color 0.3s ease;
  
  svg:not(:last-child) {
    margin-right: 0.3rem;
    font-size: 0.9rem;
  }
  
  svg:last-child {
    margin-left: 0.3rem;
    font-size: 0.8rem;
    transition: transform 0.3s ease;
    transform: ${({ $isOpen }) => $isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    justify-content: center;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  min-width: 200px;
  opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
  visibility: ${({ $isOpen }) => $isOpen ? 'visible' : 'hidden'};
  transform: ${({ $isOpen }) => $isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.3s ease;
  z-index: 10;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: static;
    box-shadow: none;
    padding: 0;
    min-width: 100%;
    max-height: ${({ $isOpen }) => $isOpen ? '1000px' : '0'};
    overflow: hidden;
    transform: none;
  }
`;

const DropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  transition: background-color 0.3s ease, color 0.3s ease;
  
  svg {
    margin-right: 0.5rem;
    font-size: 0.85rem;
  }
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
    color: ${({ theme }) => theme.colors.primary};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0.5rem 2rem;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  margin: 0 auto;
  width: 220px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const SearchInput = styled.input`
  padding: 0.4rem 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  border-radius: 20px;
  font-size: 0.85rem;
  width: 100%;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.7);
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: white;
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textLight};
  cursor: pointer;
  font-size: 0.85rem;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export default Navbar;