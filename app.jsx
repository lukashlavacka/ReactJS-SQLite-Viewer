var Table = React.createClass({
    render: function() {
        return (
            <BootstrapRow>
                <p className="info">Found {this.props.data.values.length || 0} record(s)</p>
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <Head columns={this.props.data.columns} sort={this.props.sort} handleSortChange={this.props.handleSortChange} />
                        <Body rows={this.props.data.values} />          
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
                        if(this.props.sort.column === column)
                        {
                            sortClass = this.props.sort.descending ? "glyphicon-sort-by-alphabet" : "glyphicon-sort-by-alphabet-alt";
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

var BootstrapRow = React.createClass({
    render: function() {
        return (
            <div className="row">
                <div className="col-xs-12">
                    {this.props.children}
                </div>
            </div>
        );
    }
})

var TableSource = React.createClass({
    handleChange: function(event)
    {
        var table = ReactDOM.findDOMNode(this.refs.table).value;
        this.props.handleTableChange(table);
    },
    render: function() {
        return (
            <BootstrapRow>
                <form className="form-inline">
                    <div className="form-group">
                        <label htmlFor="table">Table</label>
                        <select className="form-control" id="table" onChange={this.handleChange} ref="table">
                            <option value="">Select table</option>
                            {this.props.tables.sort().map(function(t){                              
                                return <option key={t} value={t}>{t}</option>
                            })}
                        </select>
                    </div>
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

var FileDropWrapper = React.createClass({
    onDragEnter : function(event) {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange("Drop file anywhere", "none")
    },
    onDragLeave : function(event) {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange("Drag any SQLite file", "none")
    },
    onDragOver : function(event) {
        event.stopPropagation();
        event.preventDefault();
        this.props.handleStatusChange("Drop file anywhere", "none")
    },
    onDrop: function(event){
        event.stopPropagation();
        event.preventDefault();

        var dt = event.dataTransfer;
        var files = dt.files;

        if(files && files.length && files[0])
            this.props.handleFileChange(files[0]);
    },
    render: function() {
        return (
            <div style={{ height: "100%" }} onDrop={this.onDrop} onDragEnter={this.onDragEnter} onDragOver={this.onDragOver} onDragLeave={this.onDragLeave}>
                {this.props.children}
            </div>
        );
    }
})

var Status = React.createClass({
    render: function() {
        return (
            <BootstrapRow>
            {this.props.status}         
            </BootstrapRow>
        );
    }
})

var ChartColumns = React.createClass({
    handleChange: function(event)
    {
        var xField = ReactDOM.findDOMNode(this.refs.xField).value;
        var yField = ReactDOM.findDOMNode(this.refs.yField).value;
        var yOperation = ReactDOM.findDOMNode(this.refs.yOperation).value;

        if(xField && yField)
            this.props.handleChartColumnsChange({xField : xField, yField: yField, yOperation: yOperation});
    },
    getInitialState: function() {
        return {
            agregateOperations: [
                "AVG",
                "SUM",
                "MAX",
                "MIN"
            ]
        }
    },
    render: function() {
        return (
            <BootstrapRow>
                <form className="form-inline">
                    <div className="form-group">
                        <label htmlFor="xField">X field</label>
                        <select className="form-control" id="xField" onChange={this.handleChange} ref="xField">
                            <option value="">Select X Field</option>
                            {this.props.columns.map(function(c){
                                return <option key={c} value={c}>{c}</option>
                            })}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="xField">Y field</label>
                        <select className="form-control" id="yField" onChange={this.handleChange} ref="yField">
                            <option value="">Select Y Field</option>
                            {this.props.columns.map(function(c){
                                return <option key={c} value={c}>{c}</option>
                            })}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="yOperation">Y field Agregate Operation</label>
                        <select className="form-control" id="yOperation" onChange={this.handleChange} ref="yOperation">
                            <option value="">Select Y Field Agregate Operation</option>
                            {this.state.agregateOperations.map(function(o){
                                return <option key={o} value={o}>{o}</option>
                            })}
                        </select>
                    </div>
                </form>
            </BootstrapRow>
        );
    }
})

var Interface = React.createClass({ 
    queryData: function (state) {   
        state.data = undefined;
        var query = this.generateQueryFromState(state);
        if(!query)
            return;

        var now = new Date();
        var data = state.db.exec(query);
        state.data = data[0];
        this.handleStatusChange("Last query (" + query + ") took " + (new Date() - now) + " miliseconds.", "success")
    },
    queryChartData: function (state) {   
        state.chart.data = undefined;
        var query = this.generateChartQueryFromState(state);
        if(!query)
            return;

        var now = new Date();
        var data = state.db.exec(query);
        var rawData = data[0];
        state.chart.data = this.generateChartJsData(rawData);
        this.handleStatusChange("Last chart query (" + query + ") took " + (new Date() - now) + " miliseconds.", "success")
    },
    generateChartJsData: function(rawData)
    {
        return {
            labels: rawData.values.map(function(v){return v[0]}),
            datasets: [
                {
                    label: rawData.columns[0],
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: rawData.values.map(function(v){return v[1]})             
                }
            ]
        }
    },
    generateQueryFromState: function(state) {
        if(!state.table)
            return;

        var s = squel
            .select();

        if(state.selectedColumns && state.selectedColumns.length)
            state.selectedColumns.forEach(function(c){
                s = s.field(c);
            });

        s = s.from(state.table);

        if(state.sort && state.sort.column)
            s = s.order(state.sort.column, state.sort.descending)

        return s.toString();
    },
    generateChartQueryFromState: function(state) {
        if(!state.table)
            return;

        var s = squel
            .select()
            .field(state.chart.columns.xField);
        
        switch(state.chart.columns.yOperation)
        {
            case "AVG":
                s = s.field("AVG(" + state.chart.columns.yField +")")
                break;
            case "SUM":
                s = s.field("SUM(" + state.chart.columns.yField +")")
                break;
            case "MAX":
                s = s.field("MAX(" + state.chart.columns.yField +")")
                break;
            case "MIN":
                s = s.field("MIN(" + state.chart.columns.yField +")")
                break;
            default:
                s = s.field(state.chart.columns.yField);
                break;
        }

        s = s
            .order(state.chart.columns.xField)
            .from(state.table);

        switch(state.chart.columns.yOperation)
        {
            case "AVG":
            case "SUM":
            case "MAX":
            case "MIN":
                s = s.group(state.chart.columns.xField)
                break;
            default:
                break;
        }

        return s.toString();
    },
    getTables: function(db) {
        var s = squel
            .select()
            .field("name")
            .from("sqlite_master")
            .where("type = 'table'");
        var query = s.toString();
        var data = db.exec(query);
        return data[0].values.map(function(t){ return t[0]});
    },
    getColumns: function(state) {
        state.columns = [];
        if(!state.table)
            return;
        var query = 'PRAGMA table_info("' + state.table + '")'
        var data = state.db.exec(query);
        var columnNames = data[0].values.map(function(t){ return t[1]});
        state.columns = columnNames;
    },
    handleSortChange: function(col) {
        this.setState(function(previousState){  
            if(previousState.sort.column === col)
                previousState.sort.descending = !previousState.sort.descending;
            else
                previousState.sort.descending = false;

            previousState.sort.column = col;

            this.queryData(previousState);
        })
    },
    handleTableChange: function(table) {
        this.setState(function(previousState){
            previousState.table = table;            
            this.getColumns(previousState);
            this.queryData(previousState);
        })
    },
    handleDisplayChange: function() {
        this.setState(function(previousState) {         
            this.queryData(previousState);
        });
    },
    handleFileChange: function(file) {
        this.handleStatusChange("Loading...");
        var now = new Date();
        var sqlReader = new FileReader();
        sqlReader.onload = function() {
            var Uints = new Uint8Array(sqlReader.result);
            var db = new SQL.Database(Uints);
            this.handleStatusChange("Loaded in " + (new Date() - now) + " miliseconds.", "success");
            this.setState(function(previousState) {
                previousState.db = db;
                previousState.tables = this.getTables(db);
                this.handleDisplayChange();             
            });
        }.bind(this);
        sqlReader.readAsArrayBuffer(file);
    },
    handleStatusChange: function(status, type) {
        switch(type)
        {
            case "warning":
                toastr.warning(status)
                break;
            case "success":
                toastr.success(status)
                break;
            case "none":
                break;
            case "info":
            default:
                toastr.info(status)
                break;
        }
        this.setState({ status: status });
    },
    handleColumnChange: function(columns) {
        this.setState(function(previousState){
            previousState.selectedColumns = columns;
            this.queryData(previousState);
        });
    },
    handleChartColumnsChange: function(chartColumns) {
        this.setState(function(previousState){ 
            previousState.chart.columns = chartColumns;
            this.queryChartData(previousState);
        })
    },
    getInitialState: function() {
        return {
            data: undefined,
            tables: [],
            selectedColumns: [],
            table: undefined,
            sort: {},
            chart: {},
            status: "Drag any SQLite file"
        }
    },
    render: function() {  
        if(this.state.tables && this.state.tables.length)
        {
            var table;
            var tableSource = <TableSource tables={this.state.tables} handleTableChange={this.handleTableChange}/>;     

            if(this.state.data && this.state.data.columns && this.state.data.columns.length)        
                table = <Table data={this.state.data} sort={this.state.sort} handleSortChange={this.handleSortChange}/>
            else if(this.state.table)
                table = <Status status={"No data"} />
            else
                table = <Status status={"No table selected"} />
        }

        if(this.state.columns)
        {
           var displayColumn = <DisplayColumn columns={this.state.columns} handleColumnChange={this.handleColumnChange} />
           var chartColumns = <ChartColumns columns={this.state.columns} handleChartColumnsChange={this.handleChartColumnsChange} />
        }

        if(this.state.chart && this.state.chart.data)
        {
            var chart = <LineChartComponent data={this.state.chart.data} />
        }
        
        return (
            <FileDropWrapper handleFileChange={this.handleFileChange} handleStatusChange={this.handleStatusChange}>
                <Status status={this.state.status} />
                {tableSource}
                {displayColumn}
                {chartColumns}
                {table}
                {chart}
            </FileDropWrapper>
        );
    }
})

var LineChart = Chart.React.Line;
var LineChartComponent = React.createClass({
    getInitialState: function()
    {
        return {
            options : {
                scaleShowGridLines : true
            }
        }
    },
    render: function() {
        return <LineChart data={this.props.data} options={this.state.options} width="600" height="250"/>
    }
});

ReactDOM.render(
    <Interface />,
    document.getElementById('content')
);

toastr.options.preventDuplicates = true;