import React from 'react';
import styled from 'styled-components';
import { FaCalendarAlt } from 'react-icons/fa';

const PlaceholderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  width: 100%;
  height: 200px;
  color: #666;
`;

const IconWrapper = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #888;
`;

const Text = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
`;

const EventPlaceholder = () => {
  return (
    <PlaceholderContainer>
      <IconWrapper>
        <FaCalendarAlt />
      </IconWrapper>
      <Text>Cryptography Event</Text>
    </PlaceholderContainer>
  );
};

export default EventPlaceholder;
