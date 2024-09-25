import {Button, Form, ListGroup, Spinner, Stack} from 'react-bootstrap';
import {useRef, useState} from 'react';
import Hamster from './api/Hamster';
import {formatSeconds} from './api/util';
import Major from './api/Major';

const data = JSON.parse(localStorage.getItem('data')) ?? {};
const instances = {};

function isNew(dropName, currentDropName) {
    if (!dropName)
        return false;

    const drop = localStorage.getItem(dropName);

    if (currentDropName === dropName) {
        if (!drop)
            localStorage.setItem(dropName, '1');
        return false;
    }

    return !drop;
}

function save() {
    localStorage.setItem('data', JSON.stringify(data));
}

function addAccount(dropName, token, name, extra = {}) {
    if (!(dropName in data))
        data[dropName] = [];

    data[dropName].push({token, name, ...extra});

    save();
}

function getAccounts(dropName) {
    if (dropName in data)
        return data[dropName];

    return [];
}

function delAccount(dropName, token) {
    if (dropName in data) {
        const accounts = data[dropName];
        const i = accounts.findIndex(acc => acc.token === token);
        if (i !== -1) {
            accounts.splice(i, 1);
            save();

            if (token in instances)
                delete instances[token];
        }
    }
}

function delAllAccounts(dropName) {
    if (dropName in data)
        delete data[dropName];

    localStorage.removeItem(dropName);
    save();
}

const airdrops = [
    {
        img: 'hamster.webp',
        name: 'hamster',
        title: 'Hamster',
        Airdrop: Hamster,
        msg: '🙃 Hamster Kombat ended, wasn\'t it disappointing?',
    },
    {
        size: 22,
        img: 'major.svg',
        name: 'major',
        title: 'Major',
        Airdrop: Major,
        tokenAuth: false,
    },
    {
        img: 'blum.svg',
        name: 'blum',
        title: 'Blum',
    },
].map((v) => {
    v.n = 0;

    if ('msg' in v)
        v.n -= 2;
    else if (!v.Airdrop)
        v.n -= 1;

    return v;
}).sort((a, b) => b.n - a.n);

const airdrop = Object.fromEntries(airdrops.map(drop => [drop.name, drop]));

function parseErr(e) {
    if (typeof e?.message == 'string')
        return e.message;

    return JSON.stringify(e);
}

export default function App() {
    const [, setR] = useState(false); // re-render
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(airdrops[0].name);
    const [account, setAccount] = useState('');
    const [err, setInfo] = useState('');
    const input = useRef(null);
    const drop = airdrop[selected];
    const accounts = getAccounts(drop.name);

    const instance = instances[account];

    const addAcc = async () => {
        if (!input.current)
            return;

        if (!airdrop[drop.name].Airdrop)
            return setInfo(`❌ Sorry :( ${drop.title} has no implementation`);

        if ('msg' in airdrop[drop.name])
            return setInfo(`❌ Sorry :( ${drop.title} has ended`);

        const token = (input.current.value ?? '').trim();
        if (token.length < 10 || token.includes(' '))
            return setInfo('❌ Invalid token');

        if (getAccounts(drop.name).find(v => v.token === token))
            return setInfo('❌ User already added');

        const instance = new airdrop[drop.name].Airdrop();
        setLoading(true);
        try {
            await instance.init(token, setInfo);
        } catch (e) {
            setLoading(false);
            setInfo('❌ ' + parseErr(e));
            return;
        }
        setLoading(false);
        instances[instance.authToken] = instance;

        addAccount(drop.name, instance.authToken, instance.user, drop.tokenAuth === false ? {authUrl: instance.authUrl} : undefined);
        input.current.value = '';

        setInfo('');
        setR(r => !r);
    };

    async function loadInstance(authToken, forceReload = false) {
        if (authToken !== '') {
            if (forceReload || !(authToken in instances)) {
                const instance = !(authToken in instances) ? new airdrop[drop.name].Airdrop() : instances[authToken];
                setLoading(true);
                try {
                    await instance.init(drop.tokenAuth === false && !instance.loaded ? accounts.find(a => a.token === authToken)?.authUrl : authToken, setInfo);
                    instances[authToken] = instance;
                    setInfo('');
                } catch (e) {
                    setInfo('❌ ' + parseErr(e));
                }
                setLoading(false);
            }
        }

        setLoading(false);
    }

    const onAccountSelected = async (e) => {
        const authToken = e.target.value;
        setAccount(authToken);

        await loadInstance(authToken);
    };

    const doTask = async task => {
        setLoading(true);
        setInfo(`Claiming ${task.title}`);
        try {
            await task.claim();
            setInfo('');
        } catch (e) {
            setInfo('❌ ' + parseErr(e));
        }
        setLoading(false);
    };

    const delAcc = () => {
        if (account !== '' && confirm('Are you sure to delete?')) {
            delAccount(drop.name, account);
            setAccount('');
        }
    };


    const delAllAcc = () => {
        delAllAccounts(drop.name);
        setR(r => !r);
    };

    const refresh = async () => {
        if (account !== '')
            await loadInstance(account, true);
    };

    return (
        <>
            <div className="w-100 overflow-y-auto topBar" style={{flex: 'none'}}>
                <Stack direction="horizontal" className="mb-2 px-2" style={{width: 'max-content'}}
                       gap={2}>
                    {airdrops.map(d => {
                        const onClick = () => {
                            setSelected(d.name);
                            setAccount('');
                        };

                        return (
                            <Button disabled={loading} onClick={onClick}
                                    key={d.name} variant={d.name === selected ? 'primary' : 'light'}>
                                {d.img &&
                                    <img className="me-1" width={d.size ?? 20} src={d.img}
                                         alt=""/>}{d.title}
                                {isNew(d.Airdrop && !('msg' in d) && d.name, drop.name) &&
                                    <span className="text-danger ms-1">●</span>}
                            </Button>);
                    })}
                </Stack>
            </div>

            <div className="pt-2 overflow-y-auto flex-grow-1">
                {'msg' in drop ? drop.msg : (drop.Airdrop ? (accounts.length === 0 ? 'No account found' : `${accounts.length} account(s) found`) : '😃 Coming soon')}

                {accounts.length > 0 && ('msg' in drop ? <><Stack direction="horizontal" gap={2} className="mt-2">
                        <ol>
                            {accounts.map(({token, name}) => (
                                <li key={token}>{name}</li>))}
                        </ol>
                    </Stack><Button disabled={loading} variant="danger" onClick={delAllAcc}>Clean Data</Button></> :
                    <Stack direction="horizontal" gap={2} className="mt-2">
                        <Form.Select onChange={onAccountSelected} disabled={loading}>
                            <option></option>
                            {accounts.map(({token, name}, i) => (
                                <option key={token} value={token}>{(i + 1) + ' ' + name}</option>))}
                        </Form.Select>
                        <Button disabled={loading} onClick={refresh}>⁐</Button>
                        <Button disabled={loading} variant="danger" onClick={delAcc}>X</Button>
                    </Stack>)}

                {instance &&
                    <>
                        <div className="mt-3">
                            <div className="mt-2">📃 Summary</div>
                            <ListGroup className="mt-2">
                                {instance.summary.map(v => (
                                    <ListGroup.Item key={v}>
                                        <Stack direction="horizontal">
                                            {v}
                                        </Stack>
                                    </ListGroup.Item>))}
                            </ListGroup>
                        </div>

                        <div className="mt-3">
                            <div className="mt-2">📅 Tasks</div>
                            <ListGroup className="mt-2">
                                {instance.tasks.map(v => (
                                    <ListGroup.Item action key={v.id}
                                                    onClick={() => loading || v.isDone ? undefined : doTask(v)}>
                                        <Stack direction="horizontal">
                                            <span>{v.isDone ? '✅' : '❌'} {v.title}</span>
                                            {v.seconds !== -1 &&
                                                <span className="ms-auto">{formatSeconds(v.seconds)}</span>}
                                        </Stack>
                                    </ListGroup.Item>))}
                            </ListGroup>
                        </div>

                        <div className="my-3">
                            <div className="mt-2">🎮 Games</div>
                            <ListGroup className="mt-2">
                                {/*<ListGroup.Item>😃 Coming soon</ListGroup.Item>*/}
                                {instance.games.map(v => (
                                    <ListGroup.Item action key={v.id}
                                                    onClick={() => loading || v.isDone ? undefined : doTask(v)}>
                                        <Stack direction="horizontal">
                                            <span>{v.isDone ? '✅' : '❌'} {v.title}</span>
                                            {v.seconds !== -1 &&
                                                <span className="ms-auto">{formatSeconds(v.seconds)}</span>}
                                        </Stack>
                                    </ListGroup.Item>))
                                }
                            </ListGroup>
                        </div>
                    </>
                }
            </div>

            <Stack direction="horizontal">
                <Stack direction="vertical">
                    <p className="msg mb-2 pt-2 d-flex align-items-center">{loading &&
                        <>&nbsp;<Spinner variant="primary" animation="border" size="sm"/>&nbsp;</>} {err}</p>
                    <Form.Control disabled={loading} ref={input}
                                  placeholder={(drop.tokenAuth === false ? '' : 'Auth Token or ') + 'URL'}
                                  className="mb-2"/>
                    <Button disabled={loading} onClick={addAcc}>Add</Button>
                </Stack>
            </Stack>
        </>
    );
}