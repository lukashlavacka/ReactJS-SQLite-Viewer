window.TableViewer = React.createClass({
    handleColumnChange: function(selectedColumns)
    {
        this.setState({
            selectedColumns: selectedColumns
        })
    },
    handleFilterChange: function(filters)
    {
        this.setState({
            filters: filters
        })
    },    
    getColumns: function() {
        var table = this.props.table;
        var db = this.props.db;

        var query = 'PRAGMA table_info("' + table + '")'
        var data = db.exec(query);
        var columnNames = data[0].values.map(function(t){ return t[1]});
        return columnNames;
    },
    componentDidMount: function() {
        this.setState({
            columns: this.getColumns()
        })
    },
    getInitialState: function() {
        return {
            columns: [],
            selectedColumns: [],
            filters: [{ column: "", operation: "", value: "" }]
        }
    },
    filterFilters: function(filters) {
        return _(filters)
            .filter(function(f){ return f.column && f.operation && (f.operation == "IS NULL" || f.operation == "IS NOT NULL" || f.value) })
            .uniqBy(function(f){ return f.column + "_" + f.operation + "_" + f.value })
            .value()
    },
    render: function() {
        var filteredFilters = this.filterFilters(this.state.filters);
        return (
            <div>
                <DisplayColumn columns={this.state.columns} handleColumnChange={this.handleColumnChange} />
                <FilterColumn  columns={this.state.columns} filters={this.state.filters} handleFilterChange={this.handleFilterChange} />
                <Table db={this.props.db} table={this.props.table} selectedColumns={this.state.selectedColumns} filters={filteredFilters} handleStatusChange={this.props.handleStatusChange} />
            </div>
        );
    }   
})

var FilterColumn = React.createClass({
    handleChange: function(index, type, event) {
        var filters = this.copyFilters(this.props.filters);
        switch(type)
        {
            case "column":
            case "operation":
            case "value":
                filters[index][type] = event.target.value;
                this.props.handleFilterChange(filters);
                return;
            case "filterAdd":
                filters.splice(index + 1, 0, { column: "", operation: "", value: "" });
                this.props.handleFilterChange(filters);
                return;
            case "filterRemove":
                if(this.props.filters.length === 1) {
                    filters[index] = { column: "", operation: "", value: "" };
                }
                else {
                    filters.splice(index, 1);
                }
                this.props.handleFilterChange(filters);
                return;
        }
    },
    copyFilters: function(filters){
        return filters.map(function(f){
            return {
                column: f.column,
                operation: f.operation,
                value: f.value
            }
        });
    },
    getInitialState: function()
    {
        return {
            operations: [
                "=",
                "!=",
                ">",
                ">=",
                "<",
                "<=",
                "IS NULL",
                "IS NOT NULL",
                "LIKE",
            ]
        }
    },
    render: function() {
        return (
            <BootstrapRow>
                <form className="form-inline">
                    {this.props.filters.map(function(filter, i){
                        if(filter.operation !== "IS NULL" && filter.operation !== "IS NOT NULL")
                            var valueInput =
                                <div className="form-group">
                                    <label className="" htmlFor={"value_" + i}>Operation</label>
                                    <input type="text" id={"value_" + i} value={filter.value} onChange={this.handleChange.bind(this, i, "value")} />
                                </div>
                        return (
                            <div key={i} className="">
                                <div className="form-group">
                                    <label className="" htmlFor={"column_" + i}>Column</label>
                                    <select className="form-control input-large" id={"column_" + i} value={filter.column} onChange={this.handleChange.bind(this, i, "column")}>
                                        <option value="">Column</option>
                                        {this.props.columns.map(function(c){
                                            return <option key={c} value={c}>{c}</option>
                                        })}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="" htmlFor={"operation_" + i}>Operation</label>
                                    <select className="form-control input-large" id={"operation_" + i} value={filter.operation} onChange={this.handleChange.bind(this, i, "operation")}>
                                        <option value="">Select Operation</option>
                                        {this.state.operations.map(function(o){
                                            return <option key={o} value={o}>{o}</option>
                                        })}
                                    </select>
                                </div>
                                {valueInput}
                                <div className="btn-group" role="group" aria-label="Basic example">
                                    <button type="button" className="btn btn-danger"  onClick={this.handleChange.bind(this, i, "filterRemove")}>-</button>
                                    <button type="button" className="btn btn-success" onClick={this.handleChange.bind(this, i, "filterAdd")}>+</button>
                                </div>
                            </div>
                        )
                    }.bind(this))}
                </form>
            </BootstrapRow>
        );
    }
})

var DisplayColumn = React.createClass({
    handleChange: function(event)
    {
        this.props.handleColumnChange(this.refs.selectedColumns.getCheckedValues())
    },
    render: function() {
        return (
            <BootstrapRow>
                <form>
                    <CheckboxGroup name="columns" ref="selectedColumns" onChange={this.handleChange} >
                        {this.props.columns.map(function(c){                                
                            return <label key={c} className="checkbox-inline"><input type="checkbox" value={c} />{c}</label>
                        }.bind(this))}
                    </CheckboxGroup>
                </form>
            </BootstrapRow>
        );
    }
})

var Table = React.createClass({
    getData: function() {
        var db = this.props.db;

        var s = squel
            .select();

        this.props.selectedColumns.forEach(function(c){
            s = s.column(c);
        });

        s = s.from(this.props.table);

        var filterGroups = _(this.props.filters)
            .groupBy('column')
            .forOwn(function(value){
                if(!value.length)
                    return;

                var expression = squel.expr();
                for (var i = 0; i < value.length; i++) {
                    var f = value[i];
                    var condition = f.column + " " + f.operation
                    switch(f.operation)
                    {
                        case "=":
                        case "!=":
                        case ">":
                        case ">=":
                        case "<":
                        case "<=":
                            condition += " "+ f.value;
                            break;
                        case "LIKE":
                            condition += " '"+ f.value + "'";
                            break;
                    }
                    expression = expression.or(condition)
                };

                s = s.where(expression)
            })

        if(this.state.sortColumn)
            s = s.order(this.state.sortColumn, this.state.sortDescending)

        var query = s.toString();
        if(!query)
            return [];

        var now = new Date();
        var data = db.exec(query);
        this.props.handleStatusChange("Last table query (" + query + ") took " + (new Date() - now) + " miliseconds.", "success")
        return data && data[0];

    },
    getInitialState: function() {
        return {
            sortColumn: undefined,
            sortDescending: false
        }
    },
    handleSortChange: function(sortColumn)
    {
        this.setState({
            sortColumn: sortColumn,
            sortDescending: this.state.sortColumn === sortColumn ? !this.state.sortDescending : false
        })
    },
    shouldComponentUpdate: function(nextProps, nextState) {
        if(this.props.db === nextProps.db && this.props.table === nextProps.table)
        {
            if(this.props.selectedColumns.length === nextProps.selectedColumns.length)
            {
                for (var i = 0; i < this.props.selectedColumns.length; i++) {
                    if(this.props.selectedColumns[i] !== nextProps.selectedColumns[i])
                        return true;
                };
            }
            if(this.props.filters.length === nextProps.filters.length)
            {
                for (var i = 0; i < this.props.filters.length; i++) {
                    if(
                            this.props.filters[i].column    !== nextProps.filters[i].column
                        ||  this.props.filters[i].operation !== nextProps.filters[i].operation
                        ||  this.props.filters[i].value     !== nextProps.filters[i].value)
                    {
                        return true;
                    }
                };
                return false;
            }
        }
        return true;
    },
    render: function() {
        var data = this.getData()
        if(data && data.columns.length)
            var table = <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <Head columns={data.columns} sortColumn={this.state.sortColumn} sortDescending={this.state.sortDescending} handleSortChange={this.handleSortChange} />
                            <Body rows={data.values} />          
                        </table>
                    </div>
        return (
            <BootstrapRow>
                <p className="info">Found {data && data.values && data.values.length || 0} record(s)</p>
                {table}
            </BootstrapRow>
        );
    }
})

var Head = React.createClass({
    handleSortChange: function(column, event) {
        event.preventDefault();
        this.props.handleSortChange(column) 
    },
    render: function() {
        return (
            <thead>
                <tr>
                    {this.props.columns.map(function(column){
                        var sortClass;
                        if(this.props.sortColumn === column)
                        {
                            sortClass = this.props.sortDescending ? "glyphicon-sort-by-alphabet" : "glyphicon-sort-by-alphabet-alt";
                        }
                        else
                            sortClass = "glyphicon-sort";

                        return <th key={column}><a href="#" onClick={this.handleSortChange.bind(null, column)}>{column}<span className={"glyphicon " + sortClass}></span></a></th>
                    }.bind(this))}
                </tr>
            </thead>
        );
    }
})

var Body = React.createClass({
    render: function() {
        return (
            <tbody>
                {this.props.rows.map(function(r, i){
                    return <Row key={i} values={r}/>
                }.bind(this))}
            </tbody>
        );
    }
})

var Row = React.createClass({
    convertToPlain: function(rtf) {
        rtf = rtf.replace(/\\par[d]?/g, "");
        return rtf.replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, "").trim();
    },
    decodeRTF: function(input)
    {
        if(input instanceof Uint8Array)
        {
            try {
                var decodedValue = String.fromCharCode.apply(null, input);
                var textRTFIdentifier = 'textRTF = "';
                var textRTFIndex = decodedValue.indexOf(textRTFIdentifier);                 
                if(textRTFIndex >= 0)
                {
                    var endBase64Index = decodedValue.indexOf('"', textRTFIndex + textRTFIdentifier.length);
                    var base64 = decodedValue.substring(textRTFIndex + textRTFIdentifier.length, endBase64Index)
                    var decoded64String = atob(base64);

                    return this.convertToPlain(decoded64String);
                }
            }
            catch(err)
            {
                return input;
            }
        }
        else
            return input;
    },
    render: function() {
        return (
            <tr>
                {this.props.values.map(function(v, i){
                    return <td key={i}>{ this.decodeRTF(v) }</td>
                }.bind(this))}
            </tr>
        );
    }
})
