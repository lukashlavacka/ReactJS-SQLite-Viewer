window.BootstrapRow = React.createClass({
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
    getTables: function()
    {
    	var s = squel
            .select()
            .field("name")
            .from("sqlite_master")
            .where("type = 'table'");
        var query = s.toString();
        var data = this.props.db.exec(query);
        return data[0].values.map(function(t){ return t[0]});
    },
    getInitialState: function() {
    	return {
    		tables: []
    	}
    },
    componentDidMount: function() {    	
    	this.setState({
    		tables: this.getTables()
    	})
    },
    render: function() {
        return (
            <BootstrapRow>
                <form className="form-inline">
                    <div className="form-group">
                        <label htmlFor="table">Table</label>
                        <select className="form-control" id="table" onChange={this.handleChange} ref="table">
                            <option value="">Select table</option>
                            {this.state.tables.sort().map(function(t){                              
                                return <option key={t} value={t}>{t}</option>
                            }.bind(this))}
                        </select>
                    </div>
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

window.Interface = React.createClass({ 
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
    handleFileChange: function(file) {
        var sqlReader = new FileReader();
        sqlReader.onload = function() {
           this.parseData(sqlReader.result);
        }.bind(this);
        sqlReader.readAsArrayBuffer(file);
    },
    handleLoadDefaultFile: function(event) {
    	this.handleStatusChange("Requesting file");
    	var xhr = new XMLHttpRequest();
		xhr.open('GET', '/test.sqlite', true);
		xhr.responseType = 'arraybuffer';

		xhr.onload = function(e) {
			this.parseData(xhr.response);
		}.bind(this);
		xhr.send();
    },
    parseData: function(data)
    {
    	this.handleStatusChange("Loading...");
        var now = new Date();
		var Uints = new Uint8Array(data);
		var db = new SQL.Database(Uints);
		this.handleStatusChange("Loaded in " + (new Date() - now) + " miliseconds.", "success");
		this.setState({
			db: db
		})
    },
    handleTableChange: function(table) {
        this.setState({
        	table: table
        })
    },
    handleStatusChange: function(status, statusType) {
    	if(!status)
			return;

		switch(statusType)
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
    },
    getInitialState: function() {
        return {
            table: undefined,
            db: undefined
        }
    },
    render: function() {    	
    	if(this.state.db)
    	{
    		var tableSource = <TableSource db={this.state.db} handleTableChange={this.handleTableChange} handleStatusChange={this.handleStatusChange} />
    		if(this.state.table)
    		{
    			var table = <TableViewer db={this.state.db} table={this.state.table} handleStatusChange={this.handleStatusChange} />
    			var chart = <ChartViewer db={this.state.db} table={this.state.table} handleStatusChange={this.handleStatusChange} />
    		}
    	}
        return (
            <FileDropWrapper handleFileChange={this.handleFileChange} handleStatusChange={this.handleStatusChange}>
            	<button type="button" onClick={this.handleLoadDefaultFile}>Load test file</button>
                {tableSource}
                <div className="row">
                	<div className="col-xs-12 col-md-6 col-lg-5 col-lg-offset-1">{table}</div>
                	<div className="col-xs-12 col-md-6 col-lg-5">{chart}</div>
                </div>
            </FileDropWrapper>
        );
    }
})

ReactDOM.render(
    <Interface />,
    document.getElementById('content')
);

toastr.options.preventDuplicates = true;