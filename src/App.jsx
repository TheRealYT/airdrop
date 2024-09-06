import {Button, Stack, Form, ListGroup} from 'react-bootstrap';
import {useRef, useState} from 'react';
import Hamster from './api/Hamster';

const data = JSON.parse(localStorage.getItem('data')) ?? {};
const instances = {};

function formatSeconds(seconds) {
    const pad = (num) => num.toString().padStart(2, '0');

    return `${pad(Math.floor(seconds / 3600))}:${pad(Math.round((seconds % 3600) / 60))}`;
}

function addAccount(dropName, token, name) {
    if (!(dropName in data))
        data[dropName] = [];

    data[dropName].push({token, name});

    localStorage.setItem('data', JSON.stringify(data));
}

function getAccounts(dropName) {
    if (dropName in data)
        return data[dropName];

    return [];
}

const airdrops = [
    {
        img: 'hamster.webp',
        name: 'hamster',
        title: 'Hamster',
        Airdrop: Hamster,
    },
    {
        size: 22,
        img: 'major.svg',
        name: 'major',
        title: 'Major',
    },
    {
        img: 'blum.svg',
        name: 'blum',
        title: 'Blum',
    },
];

const airdrop = Object.fromEntries(airdrops.map(drop => [drop.name, drop]));

// const hamster = new Hamster();
// hamster.init("17217134813505csR9OCW0DU46WidYVzTBCc1Dtl1wxadDcbMjPdBeOmy6PEZuYwfPGb5JPyfaZkh6249776586")

export default function App() {
    const [, setR] = useState(false); // re-render
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(airdrops[0].name);
    const [instance, setInstance] = useState(null);
    const [err, setInfo] = useState('');
    const input = useRef(null);
    const drop = airdrop[selected];
    const accounts = getAccounts(drop.name);

    const addAcc = async () => {
        if (!input.current)
            return;

        setInfo('');

        const token = input.current.value ?? '';
        if (token.length < 10 || token.includes(' '))
            return setInfo('❌ Invalid token');

        if (getAccounts(drop.name).find(v => v.token === token))
            return setInfo('❌ Token already added');

        if (!airdrop[drop.name].Airdrop)
            return setInfo(`❌ Sorry :(, ${drop.title} has no implementation`);

        const instance = new airdrop[drop.name].Airdrop();
        setLoading(true);
        try {
            await instance.init(token);
        } catch (e) {
            setLoading(false);
            setInfo('❌ ' + e?.message ?? JSON.stringify(e));
            return;
        }
        setLoading(false);
        instances[token] = instance;

        addAccount(drop.name, token, instance.user);
        input.current.value = '';

        setInfo('');
        setR(r => !r);
    };

    const onAccountSelected = async (e) => {
        const authToken = e.target.value;
        setInstance(null);

        if (authToken !== '') {
            if (!(authToken in instances)) {
                const instance = new airdrop[drop.name].Airdrop();
                setLoading(true);
                setInfo('Loading...');
                try {
                    await instance.init(authToken);
                    instances[authToken] = instance;
                    setInstance(instance);
                } catch (e) {
                    setInfo('❌ ' + e?.message ?? JSON.stringify(e));
                }
                setInfo('');
                setLoading(false);
            } else {
                setInstance(instances[authToken]);
            }
        }

        setLoading(false);
    };

    return (
        <>
            <div className="mb-2 w-100 overflow-y-auto" style={{flex: 'none'}}>
                <Stack direction="horizontal" className="mb-2 px-2" style={{width: 'max-content'}}
                       gap={2}>
                    {airdrops.map(drop => {
                        const onClick = () => {
                            setSelected(drop.name);
                            setInstance(null);
                        };

                        return (
                            <Button disabled={loading} onClick={onClick}
                                    key={drop.name} variant={drop.name === selected ? 'primary' : 'light'}>
                                {drop.img &&
                                    <img className="me-1" width={drop.size ?? 20} src={'/' + drop.img}
                                         alt=""/>}{drop.title}
                            </Button>);
                    })}
                </Stack>
            </div>

            <div className="overflow-y-auto flex-grow-1">
                {accounts.length === 0 ? 'No account found' : `${accounts.length} account(s) found`}

                <Stack direction="horizontal" gap={2} className="mt-2">
                    {accounts.length > 0 && <>
                        <Form.Select onChange={onAccountSelected} disabled={loading}>
                            <option></option>
                            {accounts.map(({token, name}, i) => (
                                <option key={token} value={token}>{name ?? 'Account ' + (i + 1)}</option>))}
                        </Form.Select>
                        <Button>⁐</Button>
                    </>}
                </Stack>

                {instance &&
                    <div className="mt-3">
                        <span>📅 Tasks</span>
                        <ListGroup className="mt-2">
                            {instance.tasks.map(v => (
                                <ListGroup.Item action key={v.id}>
                                    <Stack direction="horizontal">
                                        <span>{v.isDone ? '✅' : '❌'} {v.title}</span>
                                        <span className="ms-auto">{formatSeconds(v.seconds)}</span>
                                    </Stack>
                                </ListGroup.Item>))}
                        </ListGroup>
                    </div>
                }
            </div>

            <Stack direction="horizontal">
                <Stack direction="vertical">
                    <p className="mb-2">{err}</p>
                    <Form.Control disabled={loading} ref={input} placeholder="Auth Token" className="mb-2"/>
                    <Button disabled={loading} onClick={addAcc}>Add</Button>
                </Stack>
            </Stack>
        </>
    );
}