// slices/gameSlice.js
import { createSlice } from '@reduxjs/toolkit';

const gameSlice = createSlice({
  name: 'game',
  initialState: {
    score: 0,
  },
  reducers: {
    updateScore: (state, action) => {
      const { token, result } = action.payload;
      var url = `${process.env.REACT_APP_API_URL}/api/players/score`;
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ result }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Score updated:', data);
      })
      .catch(error => {
        console.error('Error updating score:', error);
      });
    },
  },
});

export const { updateScore } = gameSlice.actions;
export default gameSlice.reducer;
