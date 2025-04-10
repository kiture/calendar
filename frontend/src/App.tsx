import { useDispatch, useSelector } from 'react-redux';
import { selectAppTitle } from './redux/appSelectors';
import { fetchUser } from './redux/appReducer';
import { AppDispatch } from './redux/store';

function App() {
  const appTitle = useSelector(selectAppTitle);

  const dispatch = useDispatch<AppDispatch>();
  return (
    <>
      <p className="text-3xl font-bold underline">{appTitle}</p>
      <button
        onClick={() =>
          dispatch(fetchUser({ name: 'John', password: '123456' }))
        }
      >
        Fetch User
      </button>
    </>
  );
}

export default App;
