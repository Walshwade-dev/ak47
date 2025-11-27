// UI layout helpers: build base DOM structure for the game
export function createLayout(root = document.body) {
  const app = document.createElement('main');
  app.id = 'app';
  app.className = 'min-h-screen flex items-center justify-center p-6';

  const board = document.createElement('section');
  board.id = 'board';
  board.className = 'w-full max-w-3xl';

  app.appendChild(board);
  root.appendChild(app);
  return { app, board };
}
