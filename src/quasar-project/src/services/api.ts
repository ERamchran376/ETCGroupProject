import axios from 'axios';

interface LoginRequest {
  username: string;
  password: string;
}

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export default {
  login(userDetails: LoginRequest) {
    return api.post('/login',userDetails);
  },
  getUsers() {
    return api.get('/users');
  },
  addUser(userData: LoginRequest) {
    return api.post('/users',userData);
  },
  getRecords() {
    return api.get('/records');
  },
  checkToken() {
    return api.get('/');
  },
  getRecordsView() {
    return api.get('/records/view');
  },
  updateRecords(Data: unknown[]) {
    return api.post('/records/update',Data);
  },
  syncDB(Records: unknown[]) {
    return api.post('/records',Records);
  }
}
