# React.js SQLite reader

Select or drop SQLite file and UI should update.

## Demo

[lukashlavacka.github.io/ReactJS-SQLite-Viewer](//lukashlavacka.github.io/ReactJS-SQLite-Viewer)

## TODO

- [ ] Find out why empty tables don't return list of columns
- [x] Loading message while large database is working
- [ ] Investigate use of Web Worked for async use
- [x] Implement column selection
- [x] Implement one column sorting
- [x] Added sample SQLite DB file

## References

Uses [kripken/sql.js](//github.com/kripken/sql.js) library as SQLite reader
Uses [ziad-saab/react-checkbox-group](//github.com/ziad-saab/react-checkbox-group) for column selection