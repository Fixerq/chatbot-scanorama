
import React from 'react';
import Header from '../Header';
import { UserStatusCheck } from '../UserStatusCheck';

const SearchHeader = () => {
  return (
    <>
      <Header />
      <div className="mb-4">
        <UserStatusCheck />
      </div>
    </>
  );
};

export default SearchHeader;
