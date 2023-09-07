import React, { useState, useEffect,  createContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';
const searchUrl = 'https://api.github.com/users/';


//exporting github context so that we can access the context
export const GithubContext = createContext();


export const GithubProvider = ( { children } ) => {

    const [githubUser, setGithubUser] = useState( mockUser );
    const [repos, setRepos] = useState( mockRepos );
    const [followers, setFollwers] = useState( mockFollowers );

    //requests
    const [requests, setRequests] = useState( 0 );
    const [loading, setLoading] = useState( false );

    //error
    const [error, setError] = useState( { show: false, msg: '' } );

    const searchGithubUser = async ( user ) => {
        
        toggleError();
        const res = await axios( `${searchUrl}${user}` ).catch( ( err ) => {
            console.log( err );
        } )
       
        if ( res )
        {
            setGithubUser( res.data );
            const { login, followers_url } = res.data;
        
           
            
            await Promise.allSettled( [
                axios( `${rootUrl}/users/${login}/repos?per_page=100` ),
                axios( `${followers_url}?per_page=100` )] )
                .then( ( res ) => {
                    
                    const [repos, followers] = res;
                    
                    if ( repos.status === 'fulfilled' )
                    {
                        setRepos( repos.value.data );
                    }
                    if ( followers.status === 'fulfilled' )
                    {
                        setFollwers( followers.value.data );
                    }


                } ).catch( err => console.log( err ) );
           
            
        } else
        {
            toggleError(true,'there is no user with that username')
        }

        checkRequests();
        setLoading( false );


    }
        const checkRequests = () => {
            axios( `${rootUrl}/rate_limit` ).then( ( { data } ) => {
                
                let { rate: { remaining } } = data;

            
                setRequests( remaining );
                if ( remaining === 0 )
                {
                    toggleError( true, 'sorry,you have exceeded your hourly rate limit' )
                
                }
            } ).catch( ( err ) => console.log( err ) )
            
        }


        function toggleError ( show = false, msg = "" ) {
            setError( { show: show, msg: msg } )
        }





        useEffect( () => {
            checkRequests();
        }, [] );

    



        return <GithubContext.Provider value={{
            githubUser,
            repos,
            followers,
            requests,
            error,
            searchGithubUser,
            loading,
        }}>
            {children}
        </GithubContext.Provider>
    }



