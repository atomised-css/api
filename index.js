const fs = require('fs');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

const postcss = require('postcss');
const stripAnsi = require('strip-ansi');

const atomised = require('postcss-atomised');
const version = require('postcss-atomised/package.json').version;

app.get('/', (req, res) => res.send(`remote api for <a href="https://github.com/atomised-css/postcss-atomised">postcss-atomised</a> ${version}<br> POST some json that looks like <code>{"css": ".red {color: red}"}</code> to this URL`));

app.options('/api', cors());
app.post('/api', (req, res) => {
	if(req.body.css) {
		// Since postcss plugins can't pass extra fields around easily,
		// the plugin writes the JSON map out in the processing :(
		// This is a crude way of making sure mulitple requests don't
		// interfere with each other
		const jsonPath = `/tmp/${Date.now()}.map.json`;

		postcss([
			atomised({jsonPath: jsonPath})
		]).process(req.body.css)
		    .then(result => {
		    	const {css, messages} = result;
		    	return res.send({
		    		version,
		    		css,
		    		messages: messages.map(message => stripAnsi(message.text)),
		    		map: require(jsonPath)
		    	});
		    })
		    .then(() => fs.unlinkSync(jsonPath))
			.catch(e => res.status(500).send(e.message))
	} else {
		res.status(500).send('Send some JSON that looks like this: {"css": ".red {color: red}"}');
	}
})

app.listen(1337);
