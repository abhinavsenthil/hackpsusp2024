import React, {useContext, useEffect} from 'react';
import { StyleSheet, SafeAreaView, View, TextInput, Pressable, Text, Button, Image, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { generateClient } from 'aws-amplify/api';
import { createTodo } from './src/graphql/mutations';
import { listTodos, getUser, listUsers } from './src/graphql/queries';
import {createUser} from './src/graphql/mutations';
import { Amplify } from 'aws-amplify';
import amplifyconfig from './src/amplifyconfiguration.json';
import { NavigationContainer } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

Amplify.configure(amplifyconfig);

const initialState = { name: '', description: '' };
const initialloginstate = {name: ''};
const UserDataContext = React.createContext();
const client = generateClient();

// Create a provider component to provide the userData to the rest of the app
export const UserDataProvider = ({ children }) => {
  const [userData, setUserData] = React.useState();
  console.log('init userdata: ', userData);

  return (
    <UserDataContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserDataContext.Provider>
  );
};

// Create a custom hook to access userData from any component
export const useUserData = () => useContext(UserDataContext);


// DONT TOUCH THIS
const TodoScreen = () => {
  const [formState, setFormState] = React.useState(initialState);
  const [todos, setTodos] = React.useState([]);

  React.useEffect(() => {
    fetchTodos();
  }, []);

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }

  async function fetchTodos() {
    try {
      const todoData = await client.graphql({
        query: listTodos
      });
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (err) {
      console.log('error fetching todos');
    }
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return;
      const todo = { ...formState };
      setTodos([...todos, todo]);
      setFormState(initialState);
      await client.graphql({
        query: createTodo,
        variables: {
          input: todo
        }
      });
    } catch (err) {
      console.log('error creating todo:', err);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <TextInput
          onChangeText={(value) => setInput('name', value)}
          style={styles.input}
          value={formState.name}
          placeholder="Name"
        />
        <TextInput
          onChangeText={(value) => setInput('description', value)}
          style={styles.input}
          value={formState.description}
          placeholder="Description"
        />
        <Pressable onPress={addTodo} style={styles.buttonContainer}>
          <Text style={styles.buttonText}>Create todo</Text>
        </Pressable>
        {todos.map((todo, index) => (
          <View key={todo.id ? todo.id : index} style={styles.todo}>
            <Text style={styles.todoName}>{todo.name}</Text>
            <Text style={styles.todoDescription}>{todo.description}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const LoginScreen = () => {
  const [loginstate, setLoginState] = React.useState(initialloginstate);
  const { setUserData } = useUserData();
  const [actionStatus, setActionStatus] = React.useState(null);

  function setInput(key, value) {
    setLoginState({ ...loginstate, [key]: value });
  }

  async function getUserDetails() {
    try {
      if (!loginstate.name) return;
      console.log("login state is: ", loginstate);
      console.log("get user query is : ", getUser);
      const response = await client.graphql({
        query: getUser, // Use the imported getUser query
        variables: {
          name: loginstate.name // Pass the name as a variable
        }
      });

      setUserData(response.data);
      console.log('get user res is: ',response);
      if(response.data.getUser === null){
        setActionStatus('no account');
      }
      else{setActionStatus('done');}
      
      
    } catch (err) {
      console.log('error retrieving user:', err);
      setActionStatus('failed');
    }
  }

  async function createUserDetails() {
    try {
      if (!loginstate.name) return;
      console.log("login state is: ", loginstate);
      //console.log("get user query is : ", getUser);
      const response = await client.graphql({
        query: createUser, // Use the imported getUser query
        variables: {
          input: {
            name: loginstate.name, // Pass the name as a variable
            points: 0
          }
        }
      });

      setUserData(response.data);
      console.log("the response for create user is: ", response);
      setActionStatus('created user');

    } catch (err) {
      console.log('error retrieving user:', err);
      setActionStatus('already signed up');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Text style = {styles2.sectionTitle}>Login or Sign Up{"\n"}</Text>
        <TextInput
          onChangeText={(value) => setInput('name', value)}
          style={styles.input}
          value={loginstate.name}
          placeholder="Name"
        />  
        {actionStatus === 'done' && <Text>Action successful</Text>}
        {actionStatus === 'failed' && <Text>Action failed</Text>} 
        {actionStatus === 'no account' && <Text>No such account exists</Text>} 
        {actionStatus === 'created user' && <Text>Created User! Now Login</Text>} 
        {actionStatus === 'already signed up' && <Text>User already exists</Text>} 
        <Pressable onPress={getUserDetails} style={styles.buttonContainer}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>
        <Text>{"\n"} Haven't signed up?{"\n"}</Text>
        <Pressable onPress={createUserDetails} style={styles.buttonContainer}>
          <Text style={styles.buttonText}>Sign up</Text>
        </Pressable>
       
      </View>
    </SafeAreaView>
  );
  
};

const HomeScreen = () => {
  const [image, setImage] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.cancelled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={homestyles.container}>
      <Link href={'./camera'}>
        <FontAwesome name="camera" size={64} color="black" />
      </Link>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
    </View>
  );
};

const LeaderBoard = () => {
  const [sortedUsers, setSortedUsers] = React.useState([]);
  const [currLboard, setCurrLboard] = React.useState([]);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const userData = await client.graphql({
        query: listUsers
      });
      const users = userData?.data?.listUsers?.items;
      if (users) {
        const sortedUser = users.slice().sort((a, b) => b.points - a.points);
        setSortedUsers(sortedUser);
        console.log("the current data is: ", sortedUsers);
      } else {
        console.log('No users found');
      }
    } catch (err) {
      console.log('Error fetching users:', err);
    }
  }
  return (
    <View style={styles2.container}>
      <View style={styles2.tasksWrapper}>
        <Text style={styles2.sectionTitle}>Leaderboard:</Text>
      </View>
      
      <ScrollView>
        {sortedUsers.map((user, index) => (
          <View key={index} style={itemstyles.item}>
            <View style={itemstyles.itemLeft}>
              <View style={itemstyles.item}>
                <Text style={itemstyles.itemText}>{index + 1}</Text>
              </View>
              <Text style={itemstyles.itemText}>
                {user.name}{"\n"}
                Points earned: {user.points}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const ProfileScreen = () => {
  const { userData } = useUserData();
  console.log('user data is: ', userData);

  return (
    <View style={styles2.container}>
      {(userData && userData.getUser) ? (
        <View style={styles2.tasksWrapper}>
          <Text style={styles2.sectionTitle}>Hello, {userData.getUser.name}:</Text>
          <View>
            <Text>You have {userData.getUser.points} points, keep trashing more!</Text>
          </View>
        </View>
      ) : (
        <>
        <Text style={styles2.sectionTitle}>Hello, user.{"\n"}</Text>
        <Text style={itemstyles.itemText}>Login to view profile</Text>
        </>
      )}
    </View>
  );
};


const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Todo" component={TodoScreen} />
      <Tab.Screen name="Login" component={LoginScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderBoard} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const App = () => {
  return (
    <UserDataProvider>
    <NavigationContainer>
    <MyTabs />
    </NavigationContainer>
    </UserDataProvider>

  );a
};

export default App;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  todo: { marginBottom: 15 },
  input: { backgroundColor: '#ddd', marginBottom: 10, padding: 8, fontSize: 18 },
  todoName: { fontSize: 20, fontWeight: 'bold' },
  buttonContainer: { alignSelf: 'center', backgroundColor: 'black', paddingHorizontal: 8 },
  buttonText: { color: 'white', padding: 16, fontSize: 18 },
  
});

const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EAED',
  },
  tasksWrapper: {
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  items: {
    marginTop: 30,
  },
  writeTaskWrapper: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderRadius: 60,
    borderColor: '#C0C0C0',
    borderWidth: 1,
    width: 250,
  },
  addWrapper: {
    width: 60,
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#C0C0C0',
    borderWidth: 1,
  },
  addText: {},
});

const itemstyles = StyleSheet.create({
  item: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  square: {
    width: 24,
    height: 24,
    backgroundColor: '#55BCF6',
    opacity: 0.4,
    borderRadius: 5,
    marginRight: 15,
  },
  itemText: {
    maxWidth: '80%',
  },
  circular: {
    width: 12,
    height: 12,
    borderColor: '#55BCF6',
    borderWidth: 2,
    borderRadius: 5,
  },
});

const homestyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});