function Log({ value = '' } = {}) {
  console.log('Log!', value);
}

function Toggle({ toggledOn = true } = {}) {
  return { out: toggledOn }
}

function AndGate({ in1 = false, in2 = false } = {}) {
  return {
    out: in1 && in2
  };
};

function OrGate({ in1, in2 } = {}) {
  return {
    out: in1 || in2
  };
};


function Board() {
  const board = {
    usedNames: {},

    components: {},
    connections: [],

    executeComponent: function(uid, component, props = {}) {
      const storedComponent = this.components[uid];
      const componentComputedProps = {
        ...storedComponent.props,
        ...component(props)
      };

      console.log('executeComponent', uid, componentComputedProps);

      const connections = this.connections.filter((connection) => {
        return connection.from.uid === uid;
      });

      console.log(connections);

      if (!connections.length) {
        return;
      }

      const propsForAffectedComponent = connections.reduce((mem, connection) => {
        if (!mem[connection.to.prop]) {
          mem[connection.to.prop] = componentComputedProps[connection.from.prop]
        }

        return mem;
      }, {});

      const affectedComponent = connections.reduce((mem, connection) => {
        const storedAffectedComponent = this.components[connection.to.uid];
        const newProps = {
          ...storedAffectedComponent.props,
          ...propsForAffectedComponent
        };

        if (!mem[connection.to.uid]) {
          return {
            ...storedAffectedComponent,
            ...{ props: newProps }
          }
        }

      }, {});

      this.components[affectedComponent.uid] = affectedComponent;

      this.components[affectedComponent.uid].execute(affectedComponent.uid);

      // this.components[affectedComponent.uid].execute(
      //   this.components[affectedComponent.uid].uid,
      //   this.components[affectedComponent.uid],
      //   this.components[affectedComponent.uid].props
      // );
    },

    getUid(name) {
      if (!this.usedNames[name]) {
        this.usedNames[name] = 1;
      }

      const uid = `${name}_${this.usedNames[name]}`;
      this.usedNames[name] += 1;

      return uid;
    },

    createComponent: function (component) {
      const { name } = component;
      const uid = this.getUid(name);
      const createdComponent = {
        uid,
        props: {},
        executor: component,
        execute: (props) => this.executeComponent.call(
          this,
          uid,
          component,
          props
        )
      };

      const newComponents = {
        ...this.components,
        ...{ [uid]: createdComponent }
      };

      this.components = newComponents;
      this.lastId += 1;

      return createdComponent;
    },

    connect: function (createdComponent, outlet) {
      const { uid: fromUid } = createdComponent;

      return {
        to: (createdComponent, inlet) => {
          const { uid: toUid } = createdComponent;
          console.log(`connect: ${fromUid} [${outlet}] ---> [${inlet}] ${toUid}`);

          this.connections.push({
            from: { uid: fromUid, prop: outlet },
            to: { uid: toUid, prop: inlet },
          });
        }
      };
    }
  };

  return board;
}

const board = new Board();

const toggle = board.createComponent(Toggle);
const toggle2 = board.createComponent(Toggle);
const andGate = board.createComponent(AndGate);
const log = board.createComponent(Log);

console.log('board.components', board.components);

console.log('--- connections ---');

board.connect(toggle, 'out').to(andGate, 'in1');
board.connect(toggle2, 'out').to(andGate, 'in2');
board.connect(andGate, 'out').to(log, 'value');

console.log(' ');
console.log('---- simulate ----');

toggle.execute();
toggle2.execute({ toggledOn: true });
