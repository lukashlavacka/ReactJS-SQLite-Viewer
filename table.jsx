window.TableViewer = React.createClass({
    handleColumnChange: function(selectedColumns)
    {
        this.setState({
            selectedColumns: selectedColumns
        })
    },
    getInitialState: function() {
        return {
            selectedColumns: []
        }
    },
    render: function() {
        return (
            <div>
                <DisplayColumn db={this.props.db} table={this.props.table} handleColumnChange={this.state.handleColumnChange} handleStatusChange={this.handleStatusChange} />
                <Table db={this.props.db} table={this.props.table} selectedColumns={this.state.selectedColumns} handleStatusChange={this.props.handleStatusChange} />
            </div>
        );
    }   
})

var DisplayColumn = React.createClass({
    getColumns: function() {
        var table = this.props.table;
        var db = this.props.db;

        var query = 'PRAGMA table_info("' + table + '")'
        var data = db.exec(query);
        var columnNames = data[0].values.map(function(t){ return t[1]});
        return columnNames;
    },
    handleChange: function(event)
    {
        this.props.handleColumnChange(this.refs.selectedColumns.getCheckedValues())
    },
    getInitialState: function() {
        return {
            columns: []
        }
    },
    componentDidMount: function() {
        this.setState({
            columns: this.getColumns()
        })
    },
    render: function() {
        return (
            <BootstrapRow>
                <form>
                    <CheckboxGroup name="columns" ref="selectedColumns" onChange={this.handleChange} >
                        {this.state.columns.map(function(c){                                
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

        if(this.props.selectedColumns.length)
            this.props.selectedColumns.forEach(function(c){
                s = s.field(c);
            });

        s = s.from(this.props.table);

        if(this.state.sortColumn)
            s = s.order(this.state.sortColumn, this.state.sortDescending)

        var query = s.toString();
        if(!query)
            return [];

        var now = new Date();
        var data = db.exec(query);
        this.props.handleStatusChange("Last table query (" + query + ") took " + (new Date() - now) + " miliseconds.", "success")
        return data[0] && data[0] || [];

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
    render: function() {
        var data = this.getData()
        return (
            <BootstrapRow>
                <p className="info">Found {data.length || 0} record(s)</p>
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <Head columns={data.columns} sortColumn={this.state.sortColumn} sortDescending={this.state.sortDescending} handleSortChange={this.handleSortChange} />
                        <Body rows={data.values} />          
                    </table>
                </div>
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
