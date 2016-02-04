var Table = React.createClass({
	render: function() {
		return (
			<BootstrapRow>			
				<p className="info">Found {this.props.data.values.length || 0} record(s)</p>
				<div className="table-responsive">
					<table className="table table-striped table-hover">
						<Head columns={this.props.data.columns} handleSortChange={this.props.handleSortChange} />
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
						return <th key={column}><a href="#" onClick={this.handleSortChange.bind(null, column)}>{column}</a></th>
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
							{this.props.tables.map(function(t){								
								return <option key={t} value={t}>{t}</option>
							})}
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
		this.props.handleStatusChange("Drop file anywhere")
	},
	onDragLeave : function(event) {
		event.stopPropagation();
		event.preventDefault();
		this.props.handleStatusChange("Drag any SQLite file")
	},
	onDragOver : function(event) {
		event.stopPropagation();
		event.preventDefault();
		this.props.handleStatusChange("Drop file anywhere")
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

var Interface = React.createClass({
	queryData: function(state) {
		if(!state.table)
			return;
		var query = "select * from " + state.table;

		if(state.col)
		{
			query += " order by " + state.col;
			if(state.sort)
				query += " desc";
			else
				query += " asc"
		}

		var data = state.db.exec(query)
		return data[0];
	},
	getTables: function(db) {
		var data = db.exec("select name from sqlite_master WHERE type='table'")
		return data[0].values.map(function(t){ return t[0]});
	},
	handleSortChange: function(col) {
		this.setState(function(previousState){		
			if(previousState.col === col)
				previousState.sort = !previousState.sort;
			else
				previousState.sort = false;

			previousState.col = col;

			previousState.data = this.queryData(previousState);
		})
	},
	handleTableChange: function(table) {
		this.setState(function(previousState){
			previousState.table = table;
			previousState.data = this.queryData(previousState)
		})
	},
	handleDisplayChange: function() {
		this.setState(function(previousState) {
			// debugger;
			previousState.data = previousState.table && this.queryData(previousState);
		});
	},
	handleFileChange: function(file)
	{
		this.handleStatusChange("Loading...");
		var now = new Date();
		var sqlReader = new FileReader();
		sqlReader.onload = function() {
			var Uints = new Uint8Array(sqlReader.result);
			var db = new SQL.Database(Uints);
			this.handleStatusChange("Loaded in " + (new Date() - now) + " miliseconds.");
			this.setState(function(previousState) {
				previousState.db = db;
				previousState.tables = this.getTables(db);
				this.handleDisplayChange();				
			});
		}.bind(this);
		sqlReader.readAsArrayBuffer(file);
	},
	handleStatusChange: function(status)
	{
		this.setState({ status: status });
	},
	getInitialState: function() {
		return {
			data: undefined,
			tables: [],
			table: undefined,
			status: "Drag any SQLite file"
		}
	},
	render: function() {
		var tableSource;	
		var table;
		if(this.state.tables && this.state.tables.length)
		{
			tableSource = <TableSource tables={this.state.tables} handleTableChange={this.handleTableChange}/>;		

			if(this.state.data && this.state.data.columns && this.state.data.columns.length)		
				table = <Table data={this.state.data} handleSortChange={this.handleSortChange}/>
			else if(this.state.table)
				table = <Status status={"No data"} />
			else
				table = <Status status={"No table selected"} />
		}
		
		return (
			<FileDropWrapper handleFileChange={this.handleFileChange} handleStatusChange={this.handleStatusChange}>
				<Status status={this.state.status} />
				{tableSource}
				{table}
			</FileDropWrapper>
		);
	}
})

ReactDOM.render(
	<Interface />,
	document.getElementById('content')
);