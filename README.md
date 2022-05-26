dynamic-xml-builder
====

# Intro

Dynamically create XML from JS objects.

```js
const XMLObject = require('dynamic-xml-builder');

const data = new XMLObject('data');

data.user._type = 'person'
data.user.email = 'john@johnjohnnyandjohnson.com'
data.user.aliases.alias = ['John', 'Johnny', 'Johnson']
data.toXML()
```

```xml
<data>
    <user type="person">
        <email>john@johnjohnnyandjohnson.com</email>
        <aliases>
            <alias>John</alias>
            <alias>Johnny</alias>
            <alias>Johnson</alias>
        </aliases>
    </user>
</data>
```

# Examples

PS. The examples use HTML because it's a well-known XML.

Object manipulation:
```js
const XMLObject = require('dynamic-xml-builder');

var xml = new XMLObject('html');

// assign an attribute
xml._lang = 'en';
// assign a whole object
xml.head = {
    meta: {
        _charset: 'utf-8'
    }
}
// go deeper
xml.head.title = 'example'
// or more complex
xml.body = {
    div: {
        _class: 'my-design',
        p: [
            'hello', 'how', 'are', 'you'
        ],
        br: null
    }
}
// or assign a property in a non-existing path
xml.body.div.div.p = 'great'
```

```xml
<html lang="en">
	<head>
		<meta charset="utf-8"/>
		<title>example</title>
	</head>
	<body>
		<div class="my-design">
			<p>hello</p>
			<p>how</p>
			<p>are</p>
			<p>you</p>
			<br/>
			<div>
				<p>great</p>
			</div>
		</div>
	</body>
</html>
```

Configure output formatting:
```js
xml.toXML({
    indent: 2, newLine: '\n'
})
```

```xml
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <title>example</title>
  </head>
  <body>
    <div class="my-design">
      <p>hello</p>
      <p>how</p>
      <p>are</p>
      <p>you</p>
      <br/>
      <div>
        <p>great</p>
      </div>
    </div>
  </body>
</html>
```

Every element in the object tree (except for assigned primitive values) is an XMLObject. Therefore the same functionality applies to those objects:
```js
xml.head.toXML()
```
```html
<head>
    <meta charset="utf-8"/>
    <title>example</title>
</head>
```
Output a plain object:
```js
xml.head.toObject()
```
```js
{ head: { meta: { _charset: 'utf-8' }, title: 'example' } }
```

When you need to directy assign value to element you can use a value selector (_value by default):
```js
var xml = new XMLObject('a')
xml._href = 'https://www.example.com'
xml._value = 'Click me!'
```
```html
<a href="https://www.example.com">Click me!</a>
```

# Requirements

Since this is based on ES6 proxies, then ES6 support is required:

* Node 6.4.0+
* [Browsers (caniuse.com)](https://caniuse.com/#search=Proxy)

# Constructor overloads
```js
new XMLObject('html')
new XMLObject('html', {head: {}, body: {}})
new XMLObject('html', {head: {}, body: {}}, ...options)
new XMLObject({html: {head: {}, body: {}}})
new XMLObject({html: {head: {}, body: {}}}, ...options)
```

# Options

Different options can be passed to the constructor or toXML(options) method

Name|Default|Usage|Description
:--|:--|:--|:--
attrSel|"_"|constructor|used to identify attributes (attrSel + attributeName, i.e. "_charset")
valueSel|"_value"|constructor|used to set the element value directly
defVal|""|constructor|default value to use when element value has not been provided
indent|"\t"|toXML|indent definition, can be any string
newLine|"\r\n"|toXML|newline definition, can be any string
attrKey|null|toXML|when provided, will group the attributes of an element under attrKey object
declaration|null|toXML|provide *true* for the default declaration, or any string to override it
selfClose|true|toXML|provice *false* to disable self-closing tags

# Licence

MIT

