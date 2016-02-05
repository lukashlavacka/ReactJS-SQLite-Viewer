# React.js SQLite reader

Select or drop SQLite file and UI should update.

## Demo

[lukashlavacka.github.io/ReactJS-SQLite-Viewer](//lukashlavacka.github.io/ReactJS-SQLite-Viewer)

## TODO

- [x] Find out why empty tables don't return list of columns
- [x] Loading message while large database is working
- [ ] Investigate use of Web Worked for async use
- [x] Implement column selection
- [x] Implement one column sorting
- [x] Added sample SQLite DB file
- [ ] Add agregate function support for table
- [X] Charting support
- [X] Add agregate function support for chart

## References

Uses [kripken/sql.js](//github.com/kripken/sql.js) library as SQLite reader
Uses [ziad-saab/react-checkbox-group](//github.com/ziad-saab/react-checkbox-group) for column selection
Uses [hiddentao/squel](//github.com/hiddentao/squel) as SQL query builder