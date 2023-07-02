import React from 'react';
import {
    Page,
    Button,
    Flex,
    FlexItem,
    Tooltip,
    Divider, Spinner, Bullseye, Popover, Badge
} from '@patternfly/react-core';
import {KaravanApi} from "./api/KaravanApi";
import {SsoApi} from "./api/SsoApi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import './designer/karavan.css';
import {KameletsPage} from "./kamelets/KameletsPage";
import {v4 as uuidv4} from "uuid";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import Icon from "./Logo";
import {ComponentsPage} from "./components/ComponentsPage";
import {EipPage} from "./eip/EipPage";
import {ProjectsPage} from "./projects/ProjectsPage";
import UserIcon from "@patternfly/react-icons/dist/js/icons/user-icon";
import ProjectsIcon from "@patternfly/react-icons/dist/js/icons/repository-icon";
import KameletsIcon from "@patternfly/react-icons/dist/js/icons/registry-icon";
import DashboardIcon from "@patternfly/react-icons/dist/js/icons/tachometer-alt-icon";
import EipIcon from "@patternfly/react-icons/dist/js/icons/topology-icon";
import ComponentsIcon from "@patternfly/react-icons/dist/js/icons/module-icon";
import {MainLogin} from "./MainLogin";
import {DashboardPage} from "./dashboard/DashboardPage";
import {Subscription} from "rxjs";
import {ProjectEventBus} from "./api/ProjectEventBus";
import {Project, ToastMessage} from "./api/ProjectModels";
import {ProjectPage} from "./project/ProjectPage";
import {useAppConfigStore, useFileStore} from "./api/ProjectStore";
import {Notification} from "./Notification";

class MenuItem {
    pageId: string = '';
    tooltip: string = '';
    icon: any;

    constructor(pageId: string, tooltip: string, icon: any) {
        this.pageId = pageId;
        this.tooltip = tooltip;
        this.icon = icon;
    }
}

interface Props {
}

interface State {
    config: any,
    pageId: string,
    isModalOpen: boolean,
    openapi: string,
    request: string,
    filename: string,
    key: string,
    showUser?: boolean,
}

export class Main extends React.Component<Props, State> {

    public state: State = {
        config: {},
        pageId: "projects",
        isModalOpen: false,
        request: uuidv4(),
        openapi: '',
        filename: '',
        key: '',
    };

    designer = React.createRef();
    sub?: Subscription;

    componentDidMount() {
        this.sub = ProjectEventBus.onSelectProject()?.subscribe((project: Project | undefined) => {
            if (project) this.setState({pageId: "project"});
        });
        KaravanApi.getAuthType((authType: string) => {
            console.log("authType", authType);
            if (authType === 'oidc') {
                SsoApi.auth(() => {
                    KaravanApi.getMe((user: any) => {
                        console.log("me", user);
                        this.getData();
                    });
                });
            } else {
                this.setState({key: Math.random().toString()})
            }
            if (KaravanApi.isAuthorized || KaravanApi.authType === 'public') {
                this.getData();
            }
        });
    }

    componentWillUnmount() {
        this.sub?.unsubscribe();
    }

    onLogin = (username: string, password: string) => {
        KaravanApi.auth(username, password, (res: any) => {
            if (res?.status === 200) {
                this.getData();
            } else {
                this.toast("Error", "Incorrect username and/or password!", "danger");
            }
        });
    }

    getData() {
        KaravanApi.getConfiguration((config: any) => {
            this.setState({config: config, request: uuidv4()});
            useAppConfigStore.setState({config: config})
        });
        this.updateKamelets();
        this.updateComponents();
        // this.updateSupportedComponents(); // not implemented yet
    }

    updateKamelets: () => Promise<void> = async () => {
        await new Promise(resolve => {
            KaravanApi.getKamelets(yamls => {
                const kamelets: string[] = [];
                yamls.split("\n---\n").map(c => c.trim()).forEach(z => kamelets.push(z));
                KameletApi.saveKamelets(kamelets, true);
            })
            KaravanApi.getCustomKameletNames(names => {
                KameletApi.saveCustomKameletNames(names);
            })
        });
    }

    updateComponents: () => Promise<void> = async () => {
        await new Promise(resolve => {
            KaravanApi.getComponents(code => {
                const components: [] = JSON.parse(code);
                const jsons: string[] = [];
                components.forEach(c => jsons.push(JSON.stringify(c)));
                ComponentApi.saveComponents(jsons, true);
            })
        });
    }

    updateSupportedComponents: () => Promise<void> = async () => {
        await new Promise(resolve => {
            KaravanApi.getSupportedComponents(jsons => {
                ComponentApi.saveSupportedComponents(jsons);
            })
        });
    }

    pageNav = () => {
        const pages: MenuItem[] = [
            new MenuItem("dashboard", "Dashboard", <DashboardIcon/>),
            new MenuItem("projects", "Projects", <ProjectsIcon/>),
            new MenuItem("eip", "Enterprise Integration Patterns", <EipIcon/>),
            new MenuItem("kamelets", "Kamelets", <KameletsIcon/>),
            new MenuItem("components", "Components", <ComponentsIcon/>)
        ]
        return (<Flex className="nav-buttons" direction={{default: "column"}} style={{height: "100%"}}
                      spaceItems={{default: "spaceItemsNone"}}>
            <FlexItem alignSelf={{default: "alignSelfCenter"}}>
                <Tooltip className="logo-tooltip" content={"Apache Camel Karavan " + this.state.config.version}
                         position={"right"}>
                    {Icon()}
                </Tooltip>
            </FlexItem>
            {pages.map(page =>
                <FlexItem key={page.pageId} className={this.state.pageId === page.pageId ? "nav-button-selected" : ""}>
                    <Tooltip content={page.tooltip} position={"right"}>
                        <Button id={page.pageId} icon={page.icon} variant={"plain"}
                                className={this.state.pageId === page.pageId ? "nav-button-selected" : ""}
                                onClick={event => {
                                    useFileStore.setState({operation:'none', file: undefined})
                                    this.setState({pageId: page.pageId});
                                }}
                        />
                    </Tooltip>
                </FlexItem>
            )}
            <FlexItem flex={{default: "flex_2"}} alignSelf={{default: "alignSelfCenter"}}>
                <Divider/>
            </FlexItem>
            {KaravanApi.authType !== 'public' &&
                <FlexItem alignSelf={{default: "alignSelfCenter"}}>
                    <Popover
                        aria-label="Current user"
                        position={"right-end"}
                        hideOnOutsideClick={false}
                        isVisible={this.state.showUser === true}
                        shouldClose={tip => this.setState({showUser: false})}
                        shouldOpen={tip => this.setState({showUser: true})}
                        headerContent={<div>{KaravanApi.me.userName}</div>}
                        bodyContent={
                            <Flex direction={{default: "row"}}>
                                {KaravanApi.me.roles && Array.isArray(KaravanApi.me.roles)
                                    && KaravanApi.me.roles
                                        .filter((r: string) => ['administrator', 'developer', 'viewer'].includes(r))
                                        .map((role: string) => <Badge id={role} isRead>{role}</Badge>)}
                            </Flex>
                        }
                    >
                        <UserIcon className="avatar"/>
                    </Popover>
                </FlexItem>}
        </Flex>)
    }

    toast = (title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') => {
        ProjectEventBus.sendAlert(new ToastMessage(title, text, variant))
    }

    getMain() {
        return (
            <>
                <Flex direction={{default: "row"}} style={{width: "100%", height: "100%"}}
                      alignItems={{default: "alignItemsStretch"}} spaceItems={{default: 'spaceItemsNone'}}>
                    <FlexItem>
                        {this.pageNav()}
                    </FlexItem>
                    <FlexItem flex={{default: "flex_2"}} style={{height: "100%"}}>
                        {this.state.pageId === 'projects' &&
                            <ProjectsPage key={this.state.request}/>}
                        {this.state.pageId === 'project' &&
                            <ProjectPage key="projects"/>}
                        {this.state.pageId === 'dashboard' && <DashboardPage key={this.state.request}
                                                                             toast={this.toast}
                                                                             config={this.state.config}/>}
                        {this.state.pageId === 'kamelets' &&
                            <KameletsPage dark={false} onRefresh={this.updateKamelets}/>}
                        {this.state.pageId === 'components' &&
                            <ComponentsPage dark={false} onRefresh={this.updateComponents}/>}
                        {this.state.pageId === 'eip' && <EipPage dark={false}/>}
                    </FlexItem>
                </Flex>
            </>
        )
    }

    render() {
        return (
            <Page className="karavan">
                {KaravanApi.authType === undefined &&
                    <Bullseye className="loading-page">
                        <Spinner className="spinner" isSVG diameter="140px" aria-label="Loading..."/>
                        <div className="logo-placeholder">{Icon()}</div>
                    </Bullseye>}
                {(KaravanApi.isAuthorized || KaravanApi.authType === 'public') && this.getMain()}
                {!KaravanApi.isAuthorized && KaravanApi.authType === 'basic' &&
                    <MainLogin config={this.state.config} onLogin={this.onLogin}/>}
                <Notification/>
            </Page>
        )
    }
}