const id = 1775396639066;
fetch('https://durlovely-parfum-api.onrender.com/api/customers/' + id, { method: 'DELETE' })
  .then(res => res.text())
  .then(console.log);
