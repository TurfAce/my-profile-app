// templates.js
import SimpleTemplate from './SimpleTemplate';
import ColorfulTemplate from './ColorfulTemplate';

export const templates = [
  {
    id: 'template1',
    name: 'シンプルテンプレート',
    imageUrl: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fillust55.com%2F5839%2F&psig=AOvVaw1_qmAfCP_3_Nbhpo3aYkbG&ust=1736304320140000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCNjmzePL4ooDFQAAAAAdAAAAABAE',
    component: SimpleTemplate,
  },
  {
    id: 'template2',
    name: 'カラフルテンプレート',
    imageUrl: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fillust55.com%2F5839%2F&psig=AOvVaw1_qmAfCP_3_Nbhpo3aYkbG&ust=1736304320140000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCNjmzePL4ooDFQAAAAAdAAAAABAE',
    component: ColorfulTemplate,
  },
  // 他のテンプレートを追加
];

