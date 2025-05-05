import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaBars, FaTimes, FaChevronDown, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [resourcesDropdown, setResourcesDropdown] = useState(false);
  const [projectsDropdown, setProjectsDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleResourcesDropdown = () => {
    setResourcesDropdown(!resourcesDropdown);
    setProjectsDropdown(false);
    setProfileDropdown(false);
  };
  const toggleProjectsDropdown = () => {
    setProjectsDropdown(!projectsDropdown);
    setResourcesDropdown(false);
    setProfileDropdown(false);
  };
  const toggleProfileDropdown = () => {
    setProfileDropdown(!profileDropdown);
    setResourcesDropdown(false);
    setProjectsDropdown(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setResourcesDropdown(false);
    setProjectsDropdown(false);
    setProfileDropdown(false);
  }, [location.pathname]);

  return (
    <NavbarContainer $isScrolled={isScrolled}>
      <div className="container">
        <NavbarContent>
          <Logo to="/">
            <img src="/logo.png" alt="Cryptography Resource Manager" />
            <span>CryptoRM</span>
          </Logo>

          <MenuIcon onClick={toggleMenu}>
            {isOpen ? <FaTimes /> : <FaBars />}
          </MenuIcon>

          <NavMenu $isOpen={isOpen}>
            <NavItem>
              <NavLink to="/" $active={location.pathname === '/'}>Home</NavLink>
            </NavItem>
            <NavItem>
              <DropdownToggle 
                onClick={toggleResourcesDropdown}
                $active={location.pathname.startsWith('/resources')}
              >
                Resources <FaChevronDown />
              </DropdownToggle>
              <Dropdown $isOpen={resourcesDropdown}>
                <DropdownItem>
                  <NavLink to="/resources?type=video">Videos</NavLink>
                </DropdownItem>
                <DropdownItem>
                  <NavLink to="/resources?type=note">Notes</NavLink>
                </DropdownItem>
                <DropdownItem>
                  <NavLink to="/resources?type=book">Reference Books</NavLink>
                </DropdownItem>
                <DropdownItem>
                  <NavLink to="/resources?type=pdf">PDFs</NavLink>
                </DropdownItem>
                <DropdownItem>
                  <NavLink to="/resources?type=article">Articles</NavLink>
                </DropdownItem>
                <DropdownItem>
                  <NavLink to="/resources?type=document">Documents</NavLink>
                </DropdownItem>
                <DropdownItem>
                  <NavLink to="/resources">All Resources</NavLink>
                </DropdownItem>
              </Dropdown>
            </NavItem>
            <NavItem>
              <NavLink to="/articles" $active={location.pathname.startsWith('/articles')}>Articles</NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/events" $active={location.pathname.startsWith('/events')}>Events</NavLink>
            </NavItem>
            <NavItem>
              <DropdownToggle 
                onClick={toggleProjectsDropdown}
                $active={location.pathname.startsWith('/projects')}
              >
                Projects <FaChevronDown />
              </DropdownToggle>
              <Dropdown $isOpen={projectsDropdown}>
                <DropdownItem>
                  <NavLink to="/projects?type=IP">IP</NavLink>
                </DropdownItem>
                <DropdownItem>
                  <NavLink to="/projects?type=MIP">MIP</NavLink>
                </DropdownItem>
                <DropdownItem>
                  <NavLink to="/projects?type=BTP">BTP</NavLink>
                </DropdownItem>
                <DropdownItem>
                  <NavLink to="/projects?type=IS">IS</NavLink>
                </DropdownItem>
                <DropdownItem>
                  <NavLink to="/projects?type=Capstone">Capstone</NavLink>
                </DropdownItem>
              </Dropdown>
            </NavItem>
            <NavItem>
              <NavLink to="/lectures" $active={location.pathname.startsWith('/lectures')}>Lectures</NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/about" $active={location.pathname.startsWith('/about')}>About</NavLink>
            </NavItem>
          </NavMenu>

          <AuthSection>
            {user ? (
              <ProfileContainer>
                <ProfileToggle onClick={toggleProfileDropdown}>
                  <FaUser />
                  <span>{user.firstName || user.email.split('@')[0]}</span>
                  <FaChevronDown />
                </ProfileToggle>
                <ProfileDropdown $isOpen={profileDropdown}>
                  {(user.role === 'admin' || user.role === 'authorized') && (
                    <ProfileItem>
                      <NavLink to="/dashboard">Dashboard</NavLink>
                    </ProfileItem>
                  )}
                  <ProfileItem>
                    <NavLink to="/profile">My Profile</NavLink>
                  </ProfileItem>
                  <ProfileItem onClick={logout}>
                    <FaSignOutAlt /> Logout
                  </ProfileItem>
                </ProfileDropdown>
              </ProfileContainer>
            ) : (
              <>
                <AuthLink to="/login">Login</AuthLink>
                <AuthButton to="/register">Sign Up</AuthButton>
              </>
            )}
          </AuthSection>
        </NavbarContent>
      </div>
    </NavbarContainer>
  );
};

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px;
  z-index: 1000;
  transition: all 0.3s ease;
  background-color: ${({ $isScrolled, theme }) => 
    $isScrolled ? theme.colors.white : 'transparent'};
  box-shadow: ${({ $isScrolled, theme }) => 
    $isScrolled ? theme.shadows.small : 'none'};
`;

const NavbarContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizes.xlarge};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  
  img {
    height: 40px;
    margin-right: 10px;
  }
`;

const MenuIcon = styled.div`
  display: none;
  font-size: 1.5rem;
  cursor: pointer;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

const NavMenu = styled.ul`
  display: flex;
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    position: absolute;
    top: 80px;
    left: 0;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.white};
    box-shadow: ${({ theme }) => theme.shadows.medium};
    padding: 1rem 0;
    transform: ${({ $isOpen }) => $isOpen ? 'translateY(0)' : 'translateY(-100%)'};
    opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
    visibility: ${({ $isOpen }) => $isOpen ? 'visible' : 'hidden'};
    transition: all 0.3s ease;
    z-index: 999;
  }
`;

const NavItem = styled.li`
  position: relative;
  margin: 0 1rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin: 0.5rem 0;
    width: 100%;
    text-align: center;
  }
`;

const NavLink = styled(Link)`
  display: block;
  padding: 0.5rem;
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  transition: color 0.3s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DropdownToggle = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  transition: color 0.3s ease;
  
  svg {
    margin-left: 0.5rem;
    font-size: 0.75rem;
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Dropdown = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  width: 200px;
  background-color: ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  border-radius: 5px;
  padding: 0.5rem 0;
  transform: ${({ $isOpen }) => $isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
  visibility: ${({ $isOpen }) => $isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
  z-index: 10;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    position: static;
    width: 100%;
    box-shadow: none;
    padding: 0;
    max-height: ${({ $isOpen }) => $isOpen ? '1000px' : '0'};
    overflow: hidden;
    transform: none;
  }
`;

const DropdownItem = styled.li`
  &:hover {
    background-color: ${({ theme }) => theme.colors.grayLight};
  }
  
  a {
    padding: 0.5rem 1rem;
  }
`;

const AuthSection = styled.div`
  display: flex;
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const AuthLink = styled(Link)`
  margin-right: 1rem;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  transition: color 0.3s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AuthButton = styled(Link)`
  padding: 0.5rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border-radius: 5px;
  font-weight: 500;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const ProfileContainer = styled.div`
  position: relative;
`;

const ProfileToggle = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
  
  svg {
    margin-right: 0.5rem;
  }
  
  span {
    margin-right: 0.5rem;
  }
`;

const ProfileDropdown = styled.ul`
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background-color: ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  border-radius: 5px;
  padding: 0.5rem 0;
  transform: ${({ $isOpen }) => $isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
  visibility: ${({ $isOpen }) => $isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
  z-index: 10;
`;

const ProfileItem = styled.li`
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.grayLight};
  }
`;

export default Navbar;