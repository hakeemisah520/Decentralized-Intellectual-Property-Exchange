import { expect, test, describe, beforeEach, vi } from 'vitest';

// Mock the contract calls
const mockIPRegistry = new Map();
let nextId = 1;

// Mock contract functions
const mockContractFunctions = {
  'register-ip': ({ title, description, expiration }) => {
    const id = nextId++;
    const currentTime = Date.now();
    
    mockIPRegistry.set(id, {
      owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Mock principal
      title,
      description,
      'creation-date': currentTime,
      'registration-date': currentTime,
      'expiration-date': expiration,
      'is-active': true
    });
    
    return { success: true, result: id };
  },
  
  'get-ip-info': ({ id }) => {
    if (!mockIPRegistry.has(id)) return { success: false };
    return { success: true, result: mockIPRegistry.get(id) };
  },
  
  'is-ip-active': ({ id }) => {
    if (!mockIPRegistry.has(id)) return { success: false, result: false };
    return { success: true, result: mockIPRegistry.get(id)['is-active'] };
  },
  
  'transfer-ip': ({ id, 'new-owner': newOwner }) => {
    if (!mockIPRegistry.has(id)) return { success: false, error: 1 };
    
    const ipInfo = mockIPRegistry.get(id);
    if (ipInfo.owner !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
      return { success: false, error: 2 };
    }
    
    ipInfo.owner = newOwner;
    mockIPRegistry.set(id, ipInfo);
    return { success: true, result: true };
  },
  
  'set-ip-status': ({ id, 'is-active': isActive }) => {
    if (!mockIPRegistry.has(id)) return { success: false, error: 1 };
    
    const ipInfo = mockIPRegistry.get(id);
    if (ipInfo.owner !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
      return { success: false, error: 2 };
    }
    
    ipInfo['is-active'] = isActive;
    mockIPRegistry.set(id, ipInfo);
    return { success: true, result: true };
  }
};

// Mock contract call
function mockContractCall(functionName, args) {
  if (mockContractFunctions[functionName]) {
    return mockContractFunctions[functionName](args);
  }
  return { success: false, error: 'Function not found' };
}

describe('IP Registration Contract Tests', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockIPRegistry.clear();
    nextId = 1;
  });
  
  test('register-ip should create a new IP entry', () => {
    const title = 'Test IP';
    const description = 'This is a test IP description';
    const expirationDate = Date.now() + 1000 * 60 * 60 * 24 * 365; // 1 year from now
    
    const result = mockContractCall('register-ip', {
      title,
      description,
      expiration: expirationDate
    });
    
    expect(result.success).toBe(true);
    expect(result.result).toBe(1); // First ID should be 1
    
    // Verify IP was registered correctly
    const ipInfo = mockContractCall('get-ip-info', { id: 1 }).result;
    expect(ipInfo.title).toBe(title);
    expect(ipInfo.description).toBe(description);
    expect(ipInfo['expiration-date']).toBe(expirationDate);
    expect(ipInfo['is-active']).toBe(true);
  });
  
  test('get-ip-info should return IP information', () => {
    // Register an IP first
    mockContractCall('register-ip', {
      title: 'Test IP',
      description: 'Description',
      expiration: 1234567890
    });
    
    const result = mockContractCall('get-ip-info', { id: 1 });
    
    expect(result.success).toBe(true);
    expect(result.result.title).toBe('Test IP');
    expect(result.result.description).toBe('Description');
  });
  
  test('is-ip-active should check if IP is active', () => {
    // Register an IP first
    mockContractCall('register-ip', {
      title: 'Test IP',
      description: 'Description',
      expiration: 1234567890
    });
    
    let result = mockContractCall('is-ip-active', { id: 1 });
    expect(result.success).toBe(true);
    expect(result.result).toBe(true);
    
    // Set IP to inactive
    mockContractCall('set-ip-status', { id: 1, 'is-active': false });
    
    result = mockContractCall('is-ip-active', { id: 1 });
    expect(result.success).toBe(true);
    expect(result.result).toBe(false);
  });
  
  test('transfer-ip should transfer ownership', () => {
    // Register an IP first
    mockContractCall('register-ip', {
      title: 'Test IP',
      description: 'Description',
      expiration: 1234567890
    });
    
    const newOwner = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = mockContractCall('transfer-ip', { id: 1, 'new-owner': newOwner });
    
    expect(result.success).toBe(true);
    
    // Verify ownership was transferred
    const ipInfo = mockContractCall('get-ip-info', { id: 1 }).result;
    expect(ipInfo.owner).toBe(newOwner);
  });
  
  test('set-ip-status should update IP status', () => {
    // Register an IP first
    mockContractCall('register-ip', {
      title: 'Test IP',
      description: 'Description',
      expiration: 1234567890
    });
    
    const result = mockContractCall('set-ip-status', { id: 1, 'is-active': false });
    
    expect(result.success).toBe(true);
    
    // Verify status was updated
    const ipInfo = mockContractCall('get-ip-info', { id: 1 }).result;
    expect(ipInfo['is-active']).toBe(false);
  });
});
