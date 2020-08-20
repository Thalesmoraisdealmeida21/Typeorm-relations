import app from './app';

import '@shared/infra/typeorm';
import '@shared/container/index';

app.listen(3333, () => {
  console.log('🚀 Server started on port 3333!');
});
