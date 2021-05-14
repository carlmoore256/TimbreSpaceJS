
class GrainObject {
  constructor (object, buffer, position, color, features) {
    this.object = object;
    this.object.position.set(position.x, position.y, position.z);

    this.buffer = buffer;
    this.position = position;
    this.color = color;
    this.features = features;

    this.object.userData = this;
  }

  update () {

  }
}
