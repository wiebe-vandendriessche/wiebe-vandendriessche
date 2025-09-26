"use client"

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

export interface RotatingModelProps {
    // Visual
    scale?: number
    hoverScale?: number // target scale multiplier while hovered
    showPointer?: boolean // show pointer cursor on hover

    // Spin/tilt behavior
    idleSpinSpeed?: number // base spin speed when not hovered
    stopSpinOnHover?: boolean // stop spinning while hovered
    hoverAlignSpeed?: number // how quickly we align yaw to face the camera (0..1 easing)
    alignSnap?: number // snap threshold (radians) when close enough during alignment
    hoverTilt?: number // tilt factor influenced by pointer
    hoverTiltY?: number // tilt factor for Y axis (yaw) when hovered
    enableTilt?: boolean // enable tilt effect when hovered and aligned
    hoverYawRange?: number // max radians to rotate left/right to look at mouse

    // Facing & collider
    facingOffset?: number // radians offset to correct model's forward direction
    colliderMargin?: number // multiplier to expand collider bounds

    // Damping constants
    dampSpeed?: number
    dampTilt?: number
    dampScale?: number

    // Lifecycle
    onLoaded?: () => void
}

export default function RotatingModel(props: RotatingModelProps) {
    const {
        // Visual
        scale = 1,
        hoverScale = 1.05,
        showPointer = true,
        // Spin/tilt
        idleSpinSpeed = 0.01,
        stopSpinOnHover = true,
        hoverAlignSpeed = 0.25,
        alignSnap = 0.01,
        hoverTilt = 0.2,
        hoverTiltY = 0.08,
        enableTilt = true,
        hoverYawRange = Math.PI / 6, // 30deg left/right
        // Facing & collider
        facingOffset = Math.PI,
        colliderMargin = 0.9,
        // Damping
        dampSpeed = 0.1,
        dampTilt = 0.2,
        dampScale = 0.12,
        // Lifecycle
        onLoaded
    } = props
    const groupRef = useRef<THREE.Group>(null!)
    const [hovered, setHovered] = useState(false)
    const speedRef = useRef(idleSpinSpeed)
    const baseScaleRef = useRef<number>(scale)
    const { pointer, camera } = useThree()
    const [collider, setCollider] = useState<{ size: THREE.Vector3; center: THREE.Vector3 } | null>(null)
    const aligningRef = useRef(false)
    const targetYawRef = useRef(0)
    const facingOffsetRef = useRef(facingOffset)
    // For Y tilt
    const tiltYawRef = useRef(0)

    useEffect(() => {
        facingOffsetRef.current = facingOffset
    }, [facingOffset])

    const normalizeAngle = (a: number) => {
        a = (a + Math.PI) % (Math.PI * 2)
        if (a < 0) a += Math.PI * 2
        return a - Math.PI
    }

    useEffect(() => {
        document.body.style.cursor = hovered && showPointer ? 'pointer' : ''
        return () => { document.body.style.cursor = '' }
    }, [hovered, showPointer])

    // Track last aligned yaw so we can freeze it when hovered
    const lastAlignedYawRef = useRef(0)

    useFrame(() => {
        if (!groupRef.current) return
        // --- Base yaw logic (spin/align) ---
        let baseYaw = groupRef.current.rotation.y
        let targetSpeed = idleSpinSpeed
        if (hovered) {
            if (aligningRef.current) {
                const current = baseYaw
                const delta = normalizeAngle(targetYawRef.current - current)
                const step = delta * hoverAlignSpeed
                if (Math.abs(delta) < alignSnap) {
                    baseYaw = targetYawRef.current
                    aligningRef.current = false
                    lastAlignedYawRef.current = baseYaw
                } else {
                    baseYaw = current + step
                }
                targetSpeed = 0
            } else {
                // When hovered and not aligning, smoothly rotate baseYaw to look at mouse
                const targetYaw = (lastAlignedYawRef.current || baseYaw) + pointer.x * hoverYawRange
                baseYaw += (targetYaw - baseYaw) * 0.18 // smooth follow
                targetSpeed = 0
            }
        }
        else {
            speedRef.current += (targetSpeed - speedRef.current) * dampSpeed
            baseYaw += speedRef.current
        }

        // --- Tilt logic ---
        const canTilt = enableTilt && hovered && !aligningRef.current
        const targetTiltX = canTilt ? pointer.y * hoverTilt : 0
        const targetTiltZ = canTilt ? -pointer.x * hoverTilt : 0
        const targetTiltYaw = canTilt ? pointer.x * hoverTiltY : 0
        tiltYawRef.current += (targetTiltYaw - tiltYawRef.current) * dampTilt
        groupRef.current.rotation.x += (targetTiltX - groupRef.current.rotation.x) * dampTilt
        groupRef.current.rotation.z += (targetTiltZ - groupRef.current.rotation.z) * dampTilt

        // --- Apply yaw as base + tilt ---
        groupRef.current.rotation.y = baseYaw + tiltYawRef.current

        // --- Scale logic ---
        const targetScale = hovered ? baseScaleRef.current * hoverScale : baseScaleRef.current
        const s = groupRef.current.scale.x
        const newS = s + (targetScale - s) * dampScale
        groupRef.current.scale.set(newS, newS, newS)
    })

    const { scene } = useGLTF('/avatar2export.glb')
    useEffect(() => {
        if (!scene) return
        onLoaded?.()
        const box = new THREE.Box3().setFromObject(scene)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)
        size.multiplyScalar(colliderMargin)
        setCollider({ size, center })
    }, [scene, onLoaded, colliderMargin])

    useEffect(() => {
        baseScaleRef.current = scale
        if (groupRef.current) {
            groupRef.current.scale.set(scale, scale, scale)
        }
    }, [scale])

    return (
        <group ref={groupRef}>
            {collider && (
                <mesh
                    position={[collider.center.x, collider.center.y, collider.center.z]}
                    onPointerOver={(e: any) => {
                        e.stopPropagation()
                        if (groupRef.current) {
                            const pos = groupRef.current.getWorldPosition(new THREE.Vector3())
                            const dx = camera.position.x - pos.x
                            const dz = camera.position.z - pos.z
                            const yaw = Math.atan2(dx, dz) + facingOffsetRef.current
                            targetYawRef.current = yaw
                            aligningRef.current = true
                        }
                        setHovered(true)
                    }}
                    onPointerOut={(e: any) => {
                        e.stopPropagation()
                        setHovered(false)
                        aligningRef.current = false
                    }}
                    onPointerDown={(e: any) => {
                        e.stopPropagation()
                        setHovered(true)
                        if (groupRef.current) {
                            const pos = groupRef.current.getWorldPosition(new THREE.Vector3())
                            const dx = camera.position.x - pos.x
                            const dz = camera.position.z - pos.z
                            const yaw = Math.atan2(dx, dz) + facingOffsetRef.current
                            targetYawRef.current = yaw
                            aligningRef.current = true
                        }
                    }}
                    onPointerMove={(e: any) => {
                        e.stopPropagation()
                        setHovered(true)
                    }}
                    onPointerUp={(e: any) => {
                        e.stopPropagation()
                        setHovered(false)
                        aligningRef.current = false
                    }}
                >
                    <boxGeometry args={[collider.size.x, collider.size.y, collider.size.z]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
                </mesh>
            )}
            <primitive object={scene} />
        </group>
    )
}

useGLTF.preload('/avatar2export.glb')