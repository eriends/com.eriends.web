import React from "react";
import ReactDom from 'react-dom'
import Video from "./vendor/Video.js";

class App extends React.Component {
	constructor(){
		super()
		this.api = null;
		this.getApi = this.getApi.bind( this );
		this._setContent = this._setContent.bind(this);
		this._toggleControls = this._toggleControls.bind(this);

		this.state = {
			content:"<p>Any HTML content (demo only)</p>",
			showControls: true,
			controlPanelStyle:"overlay",
		}
	}
	getApi(api){
		console.log( this )
		this.api = api;
	}
	_togglePlay(){
		console.log(this.api)
		if(!this.api) return;
		this.api.togglePlay()
	}
	_volume( increment ){
		if(!this.api) return;
		this.api.volume( this.api.$video.volume + increment )
	}
	_fullscreen(){
		if(!this.api) return;
		this.api.fullscreen();
	}
	_setTime( second ){
		if(!this.api) return;
		this.api.setTime(second )
	}
	_setContent(e){
		this.setState({
			content: e.target.value
		})
	}
	_toggleControls(e){
		console.log("toggle controls")
		this.setState({
			showControls: !this.state.showControls
		})
	}
	_changeStyle(style){
		console.log("set panel style to:",  style)
		this.setState({controlPanelStyle: style });
	}
	render(){
		var sources = ["../video/video.mp4","../video/video.webm","../video/video.ogv"]
		var subtitles = [
			{
				src:"../video/captions_en.vtt",
				lang:"en",label:"English"
			},
			{
				src:"../video/captions_zh.vtt",
				lang:"zh",label:"中文"
			},
		]

		return (
			<div>
				<header className="clearfix">
					<div className="container">
						<br/>
						<h1>React-html5-video</h1>
						<Video 
							sources={sources} 
							subtitles={subtitles}
							poster="../video/poster.png" 
							metaDataLoaded={this.getApi}
							controls={this.state.showControls}
							controlPanelStyle={this.state.controlPanelStyle}
						>
							<h3 className="pull-right"><a href="http://glexe.com" target="_blank">LOGO</a></h3>
							<div dangerouslySetInnerHTML={{__html: this.state.content }}></div>
						</Video>
					</div>
				</header>
			</div>
		)
	}
}

var $app = document.getElementById('app')

ReactDom.render( <App />, $app);


