import api from 'src/services/api';
import { ref } from 'vue';

interface LoginRequest {
  username: string;
  password: string;
}

export default {
    setup() {
            const username = ref('');
            const password = ref('');

        const addUser = async () => {
          const user: string = username.value;
          const pass: string = password.value;
            try {
                const payload: LoginRequest = { username:user, password:pass};
                await api.addUser(payload);
            } catch (err) {
                console.error(err);
            }
        };

        const login = async () => {
            const user: string = username.value;
            const pass: string = password.value;
            try {
              const payload: LoginRequest = { username: user, password:pass};
              const response = await api.login(payload);

              if (response.statusText === "OK") {
                window.location.href = '/#/Home';
              }
            } catch (err) {
              console.error(err);
              alert('Login failed. Please check your credentials.');
            }
        };

        return{
          username,
          password,
          addUser,
          login
        };
    }
};
