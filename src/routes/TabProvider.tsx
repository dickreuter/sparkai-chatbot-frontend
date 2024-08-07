import React, { createContext, useState } from 'react';

const defaultTabContext = {
  tabs: [], // array of tab objects
  activeTab: null, // ID or index of the active tab
  addTab: () => {}, // function to add a tab
  removeTab: () => {}, // function to remove a tab
  setActiveTab: () => {}, // function to set the active tab
};

export const TabContext = createContext(defaultTabContext);

export const TabProvider = ({ children }) => {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  const addTab = (tab) => {
    setTabs((prevTabs) => [...prevTabs, tab]);
    setActiveTab(tab.id); // set the newly added tab as active
  };

  const removeTab = (tabId) => {
    setTabs((prevTabs) => prevTabs.filter(tab => tab.id !== tabId));
    if (activeTab === tabId && tabs.length > 1) {
      setActiveTab(tabs[0].id); // set the first tab as active if the active tab is removed
    }
  };

  const contextValue = {
    tabs,
    activeTab,
    addTab,
    removeTab,
    setActiveTab,
  };

  return (
    <TabContext.Provider value={contextValue}>
      {children}
    </TabContext.Provider>
  );
};
